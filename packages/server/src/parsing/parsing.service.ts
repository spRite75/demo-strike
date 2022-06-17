import { Injectable, Logger } from "@nestjs/common";
import { concatMap, filter, Subject, merge } from "rxjs";
import { readFile } from "fs/promises";
import { DemoFile } from "demofile";
import { DemoFile as dbDemoFile, Player as dbPlayer } from "@prisma/client";
import SteamID from "steamid";
import { CDataGCCStrike15V2MatchInfo } from "demofile/dist/protobufs/cstrike15_gcmessages";
import { DateTime } from "luxon";
import { createHash } from "crypto";

import { DemoFileService } from "src/demo-file/demo-file.service";
import { PrismaService } from "src/prisma/prisma.service";
import { notNullish } from "src/utils";
import { match } from "assert";
import { SteamWebApiService } from "src/steam-web-api/steam-web-api.service";

interface ParsedDemoInfo {
  officialMatchId: string;
  officialMatchTimestamp: string;
  steam64Ids: string[];
}

interface Match {
  id: string;
  mapName: string;
  serverName: string;
  clientName: string;
  players: Map<string, Player>;
}

class Player {
  constructor(public steam64Id: string, public displayName: string) {}
  kills = 0;
  assists = 0;
  deaths = 0;
  headshotPercentage = "--%";
}

@Injectable()
export class ParsingService {
  private readonly logger = new Logger(ParsingService.name);

  private readonly manualTriggeredDemoFileSubject = new Subject<{
    demoFile: dbDemoFile;
  }>();
  private readonly unparsedDemoFileObservable = merge(
    this.demoFileService.unparsedDemoFileObservable,
    this.manualTriggeredDemoFileSubject
  );

  constructor(
    private demoFileService: DemoFileService,
    private steamWebApiService: SteamWebApiService,
    private prismaService: PrismaService
  ) {
    // Parse .dem files
    this.unparsedDemoFileObservable
      .pipe(filter(({ demoFile: { filepath } }) => filepath.endsWith(".dem")))
      .pipe(concatMap(this.loadAndParseDemoFile.bind(this)))
      .pipe(filter(notNullish))
      .pipe(concatMap(this.updatePlayerList.bind(this)))
      .pipe(concatMap(this.saveMatch.bind(this)))
      .subscribe(({ demoFile: { filepath } }) =>
        this.logger.verbose(`finished processing ${filepath}`)
      );

    // Parse .dem.info files
    this.unparsedDemoFileObservable
      .pipe(
        filter(({ demoFile: { filepath } }) => filepath.endsWith(".dem.info"))
      )
      .pipe(concatMap(this.loadAndParseDemoInfoFile.bind(this)))
      .subscribe({ next: (data) => console.log(data) });
  }

  async parseUnprocessed() {
    const unprocessedDemoFiles =
      await this.prismaService.client.demoFile.findMany({
        where: { parsed: false, deleted: false },
      });

    unprocessedDemoFiles.forEach((demoFile) =>
      this.manualTriggeredDemoFileSubject.next({ demoFile })
    );

    return {
      message: `Queued ${unprocessedDemoFiles.length} unprocessed files for parsing.`,
    };
  }

  private async loadAndParseDemoFile<T extends { demoFile: dbDemoFile }>(
    incomingEvent: T
  ): Promise<(T & { match: Match }) | null> {
    return new Promise(async (resolve, reject) => {
      const demoFileToParse = incomingEvent.demoFile;
      try {
        this.logger.verbose(`loading ${demoFileToParse.filepath}`);
        const buffer = await readFile(demoFileToParse.filepath);
        this.logger.verbose(`loaded ${demoFileToParse.filepath}`);
        const demoFile = new DemoFile();

        const players = new Map<string, Player>();

        demoFile.gameEvents.on("event", ({ name: eventName, event }) => {
          switch (eventName) {
            case "round_start": {
              // Record players who manage to start a round
              demoFile.players.forEach((demoPlayer) => {
                const recordedPlayer = players.get(demoPlayer.steam64Id);
                if (demoPlayer.isFakePlayer || !!recordedPlayer) {
                  return;
                }
                players.set(
                  demoPlayer.steam64Id,
                  new Player(demoPlayer.steam64Id, demoPlayer.name)
                );
              });
              break;
            }
            case "round_officially_ended": {
              players.forEach((player) => {
                const demoPlayer = demoFile.players.find(
                  ({ steam64Id }) => player.steam64Id === steam64Id
                );
                if (!demoPlayer) return;

                const playerHeadshotKills = demoPlayer.matchStats
                  .map(({ headShotKills }) => headShotKills)
                  .reduce((sum, curr) => sum + curr, 0);

                player.kills = demoPlayer.kills;
                player.assists = demoPlayer.assists;
                player.deaths = demoPlayer.deaths;
                player.headshotPercentage = `${(
                  (playerHeadshotKills / player.kills) *
                  100
                ).toFixed(2)}%`;
              });
            }
          }
        });

        demoFile.on("error", (error) => {
          console.error("Error during parsing:", error);
          reject(error);
        });

        demoFile.on("end", async (event) => {
          if (event.error) {
            console.error("Error during parsing:", event.error);
            reject(event.error);
          }

          this.logger.verbose(`parsed ${demoFileToParse.filepath}`);

          const {
            header: { clientName, serverName, mapName, playbackTicks },
          } = demoFile;

          const playerSteamIds: string[] = [];

          players.forEach((_, steam64Id) => playerSteamIds.push(steam64Id));

          // TODO: Review composite key idea
          const compositeKey: string[] = [
            clientName,
            serverName,
            mapName,
            `${playbackTicks}`,
            ...playerSteamIds,
          ];

          const hash = createHash("sha256");
          compositeKey.forEach((value) => hash.write(value.trim()));

          resolve({
            ...incomingEvent,
            match: {
              id: hash.digest("base64"),
              clientName,
              serverName,
              mapName,
              players,
            },
          });
        });

        this.logger.verbose(`parsing ${demoFileToParse.filepath}`);
        demoFile.parse(buffer);
      } catch (e) {
        this.logger.error(e);
        resolve(null);
      }
    });
  }

  private async saveMatch<
    T extends { demoFile: dbDemoFile; match: Match; updatedPlayers: dbPlayer[] }
  >(incomingEvent: T): Promise<T> {
    const {
      demoFile: { filepath },
      match: { id, clientName, serverName, mapName, players },
      updatedPlayers,
    } = incomingEvent;
    this.logger.verbose(`deleting existing players from Match ${id}`);
    await this.prismaService.client.matchPlayer.deleteMany({
      where: { matchId: id },
    });
    this.logger.verbose(`deleting existing Match ${id}`);
    await this.prismaService.client.match.deleteMany({
      where: { id },
    });
    this.logger.verbose(`saving Match ${id} from ${filepath}`);
    await this.prismaService.client.match.create({
      data: {
        id,
        clientName,
        serverName,
        mapName,
        demoFile: { connect: { filepath } },
      },
    });
    this.logger.verbose(`adding players for Match ${id}`);
    await this.prismaService.client.matchPlayer.createMany({
      data: Array.from(players.values())
        .map((player) => {
          const playerId = updatedPlayers.find(
            (p) => p.steam64Id === player.steam64Id
          )?.id;

          if (!playerId) return null;

          return {
            ...player,
            matchId: id,
            playerId,
          };
        })
        .filter(notNullish),
    });

    return incomingEvent;
  }

  private async updatePlayerList<T extends { match: Match }>(
    incomingEvent: T
  ): Promise<T & { updatedPlayers: dbPlayer[] }> {
    const {
      match: { players },
    } = incomingEvent;
    const playersArray = Array.from(players.values());

    const playerSummaries = await this.steamWebApiService.getPlayerSummaries(
      playersArray.map(({ steam64Id }) => steam64Id)
    );

    const updatedPlayers = await Promise.all(
      playersArray.map((player) => {
        const playerSummary = playerSummaries.get(player.steam64Id);

        return this.prismaService.client.player.upsert({
          where: { steam64Id: player.steam64Id },
          create: {
            steam64Id: player.steam64Id,
            displayName: playerSummary
              ? playerSummary.displayName
              : player.displayName,
            steamProfileUrl: playerSummary && playerSummary.profileUrl,
            steamAvatarUrlDefault: playerSummary && playerSummary.avatar,
            steamAvatarUrlMedium: playerSummary && playerSummary.avatarMedium,
            steamAvatarUrlFull: playerSummary && playerSummary.avatarFull,
          },
          update: {
            displayName: playerSummary && playerSummary.displayName,
            steamAvatarUrlDefault: playerSummary && playerSummary.avatar,
            steamAvatarUrlMedium: playerSummary && playerSummary.avatarMedium,
            steamAvatarUrlFull: playerSummary && playerSummary.avatarFull,
          },
        });
      })
    );

    return { ...incomingEvent, updatedPlayers };
  }

  private async loadAndParseDemoInfoFile<T extends { demoFile: dbDemoFile }>(
    incomingEvent: T
  ): Promise<
    T & {
      info: ParsedDemoInfo;
    }
  > {
    const buffer = await readFile(incomingEvent.demoFile.filepath);
    const demoInfoMessage = CDataGCCStrike15V2MatchInfo.decode(buffer);

    const { matchid, matchtime, roundstatsall } = demoInfoMessage;

    const steam64Ids =
      roundstatsall[roundstatsall.length - 1]?.reservation?.accountIds.map(
        (steam3Id) => new SteamID(`[U:1:${steam3Id}]`).getSteamID64()
      ) ?? [];

    return {
      ...incomingEvent,
      info: {
        officialMatchId: matchid.toString(),
        officialMatchTimestamp: DateTime.fromSeconds(matchtime).toISO(),
        steam64Ids,
      },
    };
  }
}
