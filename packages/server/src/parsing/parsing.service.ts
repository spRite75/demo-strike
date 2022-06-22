import { Injectable, Logger } from "@nestjs/common";
import { concatMap, filter, Subject, merge } from "rxjs";
import { readFile } from "fs/promises";
import { DemoFile } from "demofile";
import {
  DemoFile as dbDemoFile,
  MatchPlayer,
  Player as dbPlayer,
} from "@prisma/client";
import SteamID from "steamid";
import { CDataGCCStrike15V2MatchInfo } from "demofile/dist/protobufs/cstrike15_gcmessages";
import { DateTime } from "luxon";
import { createHash } from "crypto";

import { DemoFileService } from "src/demo-file/demo-file.service";
import { PrismaService } from "src/prisma/prisma.service";
import { notNullish } from "src/utils";
import { SteamWebApiService } from "src/steam-web-api/steam-web-api.service";
import {
  extractPlayerScore,
  getPlayerFinalTeamLetter,
  getTeamLetter,
  TeamLetter,
} from "./demofile-helpers";

interface ParsedDemoInfo {
  officialMatchId: string;
  officialMatchTimestamp: string;
  steam64Ids: string[];
}

interface ParsedMatch {
  id: string;
  mapName: string;
  serverName: string;
  clientName: string;
  teams: Map<TeamLetter, ParsedMatchTeam>;
  players: Map<string, ParsedMatchPlayer>;
}

interface ParsedMatchTeam {
  scoreFirstHalf: number;
  scoreSecondHalf: number;
  scoreTotal: number;
}

export interface ParsedMatchPlayerScore {
  kills: number;
  assists: number;
  deaths: number;
  headshotPercentage: string;
}
export class ParsedMatchPlayer {
  constructor(
    public steam64Id: string,
    public displayName: string,
    public teamLetter: TeamLetter
  ) {}
  kills = 0;
  assists = 0;
  deaths = 0;
  headshotPercentage = "--%";

  updateScore(newScore: ParsedMatchPlayerScore) {
    const { kills, assists, deaths, headshotPercentage } = newScore;
    this.kills = kills;
    this.assists = assists;
    this.deaths = deaths;
    this.headshotPercentage = headshotPercentage;
  }
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
        where: { isParsed: false, isDeleted: false },
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
  ): Promise<(T & { match: ParsedMatch }) | null> {
    return new Promise(async (resolve, reject) => {
      const demoFileToParse = incomingEvent.demoFile;
      try {
        this.logger.verbose(`loading ${demoFileToParse.filepath}`);
        const buffer = await readFile(demoFileToParse.filepath);
        this.logger.verbose(`loaded ${demoFileToParse.filepath}`);
        const demoFile = new DemoFile();

        const teams = new Map<TeamLetter, ParsedMatchTeam>();
        const players = new Map<string, ParsedMatchPlayer>();

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
                  new ParsedMatchPlayer(
                    demoPlayer.steam64Id,
                    demoPlayer.name,
                    getPlayerFinalTeamLetter(demoFile, demoPlayer)
                  )
                );
              });
              break;
            }
            case "player_disconnect": {
              const player = players.get(event.player.steam64Id);
              if (!player) return;
              player.updateScore(extractPlayerScore(event.player));
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

          demoFile.players.forEach((demoPlayer) => {
            const player = players.get(demoPlayer.steam64Id);
            if (!player) return;
            player.updateScore(extractPlayerScore(demoPlayer));
          });

          const {
            header: { clientName, serverName, mapName, playbackTicks },
          } = demoFile;

          demoFile.teams.forEach((team) => {
            const teamLetter = getTeamLetter(team.teamNumber);
            if (teamLetter === "???") return;

            const { scoreFirstHalf, scoreSecondHalf, score: scoreTotal } = team;
            teams.set(teamLetter, {
              scoreFirstHalf,
              scoreSecondHalf,
              scoreTotal,
            });
          });

          const playerSteamIds = Array.from(players.keys()).sort();

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

          this.logger.verbose(`parsed ${demoFileToParse.filepath}`);

          resolve({
            ...incomingEvent,
            match: {
              id: hash.digest("hex"),
              clientName,
              serverName,
              mapName,
              teams,
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
    T extends {
      demoFile: dbDemoFile;
      match: ParsedMatch;
      updatedPlayers: dbPlayer[];
    }
  >(incomingEvent: T): Promise<T> {
    const {
      demoFile: { filepath },
      match,
      updatedPlayers,
    } = incomingEvent;
    const { teams, players } = match;
    this.logger.verbose(`deleting existing players from Match ${match.id}`);
    await this.prismaService.client.matchPlayer.deleteMany({
      where: { matchId: match.id },
    });
    this.logger.verbose(`deleting existing teams from Match ${match.id}`);
    await this.prismaService.client.matchTeam.deleteMany({
      where: { matchId: match.id },
    });
    this.logger.verbose(`deleting existing Match ${match.id}`);
    await this.prismaService.client.match.deleteMany({
      where: { id: match.id },
    });
    this.logger.verbose(`saving Match ${match.id} from ${filepath}`);
    const { id: matchId } = await this.prismaService.client.match.create({
      data: {
        id: match.id,
        clientName: match.clientName,
        serverName: match.serverName,
        mapName: match.mapName,
        demoFile: { connect: { filepath } },
      },
    });
    this.logger.verbose(`adding teams for Match ${match.id}`);
    const matchTeamId = (matchId: string, teamLetter: TeamLetter) =>
      `${matchId}_${teamLetter}`;
    await this.prismaService.client.matchTeam.createMany({
      data: Array.from(teams).map(
        ([teamLetter, { scoreFirstHalf, scoreSecondHalf, scoreTotal }]) => ({
          id: matchTeamId(matchId, teamLetter),
          matchId,
          team: teamLetter,
          scoreFirstHalf,
          scoreSecondHalf,
          scoreTotal,
        })
      ),
    });

    this.logger.verbose(`adding players for Match ${match.id}`);
    await this.prismaService.client.matchPlayer.createMany({
      data: Array.from(players.values())
        .map((player): MatchPlayer | null => {
          const playerId = updatedPlayers.find(
            (p) => p.steam64Id === player.steam64Id
          )?.id;

          if (!playerId) return null;

          const {
            displayName,
            kills,
            assists,
            deaths,
            headshotPercentage,
            teamLetter,
          } = player;

          return {
            id: `${match.id}_${playerId}`,
            displayName,
            kills,
            assists,
            deaths,
            headshotPercentage,
            matchId,
            playerId,
            matchTeamId: matchTeamId(matchId, teamLetter),
          };
        })
        .filter(notNullish),
    });

    return incomingEvent;
  }

  private async updatePlayerList<T extends { match: ParsedMatch }>(
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
