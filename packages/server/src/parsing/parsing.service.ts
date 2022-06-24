import { Injectable, Logger } from "@nestjs/common";
import { filter, Subject, merge } from "rxjs";
import { readFile } from "fs/promises";
import { DemoFile } from "demofile";
import {
  DemoFile as dbDemoFile,
  MatchPlayer,
  Match as dbMatch,
  MatchInfo as dbMatchInfo,
  Player as dbPlayer,
  Prisma,
} from "@prisma/client";
import SteamID from "steamid";
import { CDataGCCStrike15V2MatchInfo } from "demofile/dist/protobufs/cstrike15_gcmessages";
import { DateTime } from "luxon";
import { createHash } from "crypto";

import { DemoFileService } from "../demo-file/demo-file.service";
import { PrismaService } from "../prisma/prisma.service";
import { SteamWebApiService } from "../steam-web-api/steam-web-api.service";
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
  headshotPercentage: number | null;
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
  headshotPercentage: null | number = null;

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
      .subscribe({
        next: async ({ demoFile }) => {
          const match = await this.loadAndParseDemoFile(demoFile);
          if (!match) {
            return;
          }
          const updatedPlayerRecords = await this.updatePlayerList(match);
          const matchRecord = await this.saveMatch({
            demoFile,
            match,
            updatedPlayerRecords,
          });
          await this.connectMatchToInfo({ demoFile, matchRecord });
          this.logger.verbose(`finished processing ${demoFile.filepath}`);
        },
      });

    // Parse .dem.info files
    this.unparsedDemoFileObservable
      .pipe(
        filter(({ demoFile: { filepath } }) => filepath.endsWith(".dem.info"))
      )
      .subscribe({
        next: async ({ demoFile }) => {
          const info = await this.loadAndParseDemoInfoFile(demoFile);
          const infoRecord = await this.saveMatchInfo({ demoFile, info });
          await this.connectMatchToInfo({ demoFile, infoRecord });
          this.logger.verbose(`finished processing ${demoFile.filepath}`);
        },
      });
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

  private async loadAndParseDemoFile(
    demoFile: dbDemoFile
  ): Promise<ParsedMatch | null> {
    return new Promise(async (resolve, reject) => {
      const demoFileToParse = demoFile;
      try {
        const buffer = await readFile(demoFileToParse.filepath);
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
              const player = players.get(event.player?.steam64Id);
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

          resolve({
            id: hash.digest("hex"),
            clientName,
            serverName,
            mapName,
            teams,
            players,
          });
        });

        demoFile.parse(buffer);
      } catch (e) {
        this.logger.error(e);
        resolve(null);
      }
    });
  }

  private async saveMatch(props: {
    demoFile: dbDemoFile;
    match: ParsedMatch;
    updatedPlayerRecords: dbPlayer[];
  }): Promise<dbMatch> {
    const {
      demoFile,
      match,
      match: { teams, players },
      updatedPlayerRecords,
    } = props;
    const matchRecord = await this.prismaService.client.match.upsert({
      where: { id: match.id },
      create: {
        id: match.id,
        clientName: match.clientName,
        serverName: match.serverName,
        mapName: match.mapName,
        DemoFile: { connect: { filepath: demoFile.filepath } },
      },
      update: {
        clientName: match.clientName,
        serverName: match.serverName,
        mapName: match.mapName,
        DemoFile: { connect: { filepath: demoFile.filepath } },
      },
    });

    const matchTeamId = (matchId: string, teamLetter: TeamLetter) =>
      `${matchId}_${teamLetter}`;

    await Promise.all(
      Array.from(teams).map(
        ([teamLetter, { scoreFirstHalf, scoreSecondHalf, scoreTotal }]) =>
          this.prismaService.client.matchTeam.upsert({
            where: { id: matchTeamId(matchRecord.id, teamLetter) },
            create: {
              id: matchTeamId(matchRecord.id, teamLetter),
              matchId: matchRecord.id,
              team: teamLetter,
              scoreFirstHalf,
              scoreSecondHalf,
              scoreTotal,
            },
            update: {
              id: matchTeamId(matchRecord.id, teamLetter),
              matchId: matchRecord.id,
              team: teamLetter,
              scoreFirstHalf,
              scoreSecondHalf,
              scoreTotal,
            },
          })
      )
    );

    await Promise.all(
      Array.from(players.values()).map(async (player) => {
        const playerId = updatedPlayerRecords.find(
          (p) => p.steam64Id === player.steam64Id
        )?.id;

        if (!playerId) return;

        const {
          displayName,
          kills,
          assists,
          deaths,
          headshotPercentage,
          teamLetter,
        } = player;

        const id = `${match.id}_${playerId}`;

        await this.prismaService.client.matchPlayer.upsert({
          where: { id },
          create: {
            id,
            displayName,
            kills,
            assists,
            deaths,
            headshotPercentage:
              typeof headshotPercentage === "number"
                ? new Prisma.Decimal(headshotPercentage)
                : null,
            matchId: matchRecord.id,
            playerId,
            matchTeamId: matchTeamId(matchRecord.id, teamLetter),
          },
          update: {
            displayName,
            kills,
            assists,
            deaths,
            headshotPercentage:
              typeof headshotPercentage === "number"
                ? new Prisma.Decimal(headshotPercentage)
                : null,
            matchId: matchRecord.id,
            playerId,
            matchTeamId: matchTeamId(matchRecord.id, teamLetter),
          },
        });
      })
    );

    return matchRecord;
  }

  private async updatePlayerList(match: ParsedMatch): Promise<dbPlayer[]> {
    const { players } = match;
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

    return updatedPlayers;
  }

  private async loadAndParseDemoInfoFile(
    demoFile: dbDemoFile
  ): Promise<ParsedDemoInfo> {
    const buffer = await readFile(demoFile.filepath);
    const demoInfoMessage = CDataGCCStrike15V2MatchInfo.decode(buffer);

    const { matchid, matchtime, roundstatsall } = demoInfoMessage;

    const steam64Ids =
      roundstatsall[roundstatsall.length - 1]?.reservation?.accountIds.map(
        (steam3Id) => new SteamID(`[U:1:${steam3Id}]`).getSteamID64()
      ) ?? [];

    return {
      officialMatchId: matchid.toString(),
      officialMatchTimestamp: DateTime.fromSeconds(matchtime).toISO(),
      steam64Ids,
    };
  }

  private async saveMatchInfo(params: {
    demoFile: dbDemoFile;
    info: ParsedDemoInfo;
  }): Promise<dbMatchInfo> {
    const {
      demoFile,
      info: { officialMatchId, officialMatchTimestamp, steam64Ids },
    } = params;

    let infoRecord = await this.prismaService.client.matchInfo.findUnique({
      where: { id: officialMatchId },
    });

    if (!infoRecord) {
      infoRecord = await this.prismaService.client.matchInfo.create({
        data: {
          id: officialMatchId,
          matchTimestamp: officialMatchTimestamp,
          steam64Ids,
          DemoFile: { connect: { id: demoFile.id } },
        },
      });
    }

    return infoRecord;
  }

  private async connectMatchToInfo(params: {
    demoFile: dbDemoFile;
    infoRecord?: dbMatchInfo;
    matchRecord?: dbMatch;
  }): Promise<void> {
    const { demoFile, infoRecord, matchRecord } = params;

    if (infoRecord) {
      const matchDemoFileRecord =
        await this.prismaService.client.demoFile.findUnique({
          where: { filepath: demoFile.filepath.replace(".info", "") },
          include: { Match: true },
        });

      if (matchDemoFileRecord?.Match) {
        try {
          await this.prismaService.client.match.update({
            where: { id: matchDemoFileRecord.Match.id },
            data: { MatchInfo: { connect: { id: infoRecord.id } } },
          });
        } catch {}
      }
    } else if (matchRecord) {
      const infoDemoFileRecord =
        await this.prismaService.client.demoFile.findUnique({
          where: { filepath: demoFile.filepath.concat(".info") },
          include: { MatchInfo: true },
        });

      if (infoDemoFileRecord?.MatchInfo) {
        try {
          await this.prismaService.client.match.update({
            where: { id: matchRecord.id },
            data: {
              MatchInfo: { connect: { id: infoDemoFileRecord.MatchInfo.id } },
            },
          });
        } catch {}
      }
    }
  }
}
