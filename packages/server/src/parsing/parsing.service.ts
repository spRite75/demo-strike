import { Injectable, Logger } from "@nestjs/common";
import { Subject } from "rxjs";
import { readFile } from "fs/promises";
import { DemoFile } from "demofile";
import {
  Prisma,
  DiskFileKind,
  DiskFile,
  DemoInfo,
  Demo,
  DemoTeamSide,
  DemoTeam,
  DemoTeamPlayer,
} from "@prisma/client";
import SteamID from "steamid";
import { CDataGCCStrike15V2MatchInfo } from "demofile/dist/protobufs/cstrike15_gcmessages";
import { DateTime } from "luxon";
import { createHash } from "crypto";

import { PrismaService } from "../prisma/prisma.service";
import { SteamWebApiService } from "../steam-web-api/steam-web-api.service";
import {
  extractPlayerScore,
  getPlayerFinalTeamLetter,
  getDemoTeamSide,
  TeamLetter,
} from "./demofile-helpers";
import { DiskFileService } from "../disk-file/disk-file.service";
import { notNullish } from "../utils";

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
  teams: Map<DemoTeamSide, ParsedMatchTeam>;
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
    public team: DemoTeamSide
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

  constructor(
    private diskFileService: DiskFileService,
    private steamWebApiService: SteamWebApiService,
    private prismaService: PrismaService
  ) {
    diskFileService.unprocessedDiskFiles.subscribe({
      next: async (diskFile) => {
        if (diskFile.kind === DiskFileKind.DEMO_INFO) {
          await this.loadAndParseDemoInfo(diskFile).then((parsedDemoInfo) =>
            this.saveDemoInfo(parsedDemoInfo, diskFile)
          );
        } else if (diskFile.kind === DiskFileKind.DEMO) {
          const parsedDemo = await this.loadAndParseDemo(diskFile);
          const demo = await this.saveDemo(parsedDemo, diskFile);
          const demoTeams = await this.saveDemoTeams(parsedDemo.teams, demo);
          const demoTeamPlayers = await this.saveDemoTeamPlayers(
            parsedDemo.players,
            demoTeams
          );
        }
      },
    });
  }

  private async loadAndParseDemoInfo(
    diskFile: DiskFile
  ): Promise<ParsedDemoInfo> {
    const buffer = await readFile(diskFile.filepath);
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

  private async saveDemoInfo(
    parsedDemoInfo: ParsedDemoInfo,
    diskFile: DiskFile
  ): Promise<DemoInfo> {
    let savedDemoInfo = await this.prismaService.client.demoInfo.findUnique({
      where: { id: parsedDemoInfo.officialMatchId },
    });

    if (!savedDemoInfo) {
      savedDemoInfo = await this.prismaService.client.demoInfo.create({
        data: {
          id: parsedDemoInfo.officialMatchId,
          matchTimestamp: parsedDemoInfo.officialMatchTimestamp,
          steam64Ids: parsedDemoInfo.steam64Ids,
          SourceDiskFile: { connect: { id: diskFile.id } },
        },
      });
    }

    return savedDemoInfo;
  }

  private async loadAndParseDemo(diskFile: DiskFile): Promise<ParsedMatch> {
    const buffer = await readFile(diskFile.filepath);
    return this.parseDemoFromBuffer(buffer);
  }

  private async parseDemoFromBuffer(buffer: Buffer): Promise<ParsedMatch> {
    return new Promise(async (resolve, reject) => {
      const demoFile = new DemoFile();

      const teams = new Map<DemoTeamSide, ParsedMatchTeam>();
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
          const teamSide = getDemoTeamSide(team.teamNumber);
          if (teamSide === DemoTeamSide.UNKNOWN) return;

          const { scoreFirstHalf, scoreSecondHalf, score: scoreTotal } = team;
          teams.set(teamSide, {
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

      try {
        demoFile.parse(buffer);
      } catch (e) {
        this.logger.error(e);
        reject(null);
      }
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

  private async saveDemo(
    parsedDemo: ParsedMatch,
    diskFile: DiskFile
  ): Promise<Demo> {
    return this.prismaService.client.demo.upsert({
      where: { id: parsedDemo.id },
      create: {
        id: parsedDemo.id,
        clientName: parsedDemo.clientName,
        serverName: parsedDemo.serverName,
        mapName: parsedDemo.mapName,
        SourceDiskFile: { connect: { id: diskFile.id } },
      },
      update: {
        clientName: parsedDemo.clientName,
        serverName: parsedDemo.serverName,
        mapName: parsedDemo.mapName,
        SourceDiskFile: { connect: { id: diskFile.id } },
      },
    });
  }

  private async saveDemoTeams(
    teamsMap: Map<DemoTeamSide, ParsedMatchTeam>,
    sourceDemo: Demo
  ): Promise<DemoTeam[]> {
    return Promise.all(
      Array.from(teamsMap).map(
        ([teamSide, { scoreFirstHalf, scoreSecondHalf, scoreTotal }]) =>
          this.prismaService.client.demoTeam.upsert({
            where: { side_demoId: { demoId: sourceDemo.id, side: teamSide } },
            create: {
              side: teamSide,
              scoreFirstHalf,
              scoreSecondHalf,
              scoreTotal,
              Demo: { connect: { id: sourceDemo.id } },
            },
            update: {
              scoreFirstHalf,
              scoreSecondHalf,
              scoreTotal,
            },
          })
      )
    );
  }

  private async saveDemoTeamPlayers(
    playersMap: Map<string, ParsedMatchPlayer>,
    demoTeams: DemoTeam[]
  ): Promise<DemoTeamPlayer[]> {
    return Promise.all(
      Array.from(playersMap.values()).map((player) => {
        const demoTeam = demoTeams.find(
          (demoTeam) => demoTeam.side === player.team
        );
        if (!demoTeam) return null;

        return this.prismaService.client.demoTeamPlayer.upsert({
          where: {
            steam64Id_demoTeamSide_demoTeamDemoId: {
              demoTeamDemoId: demoTeam.demoId,
              demoTeamSide: player.team,
              steam64Id: player.steam64Id,
            },
          },
          create: {
            displayName: player.displayName,
            kills: player.kills,
            assists: player.assists,
            deaths: player.deaths,
            headshotPercentage:
              typeof player.headshotPercentage === "number"
                ? new Prisma.Decimal(player.headshotPercentage)
                : null,
            DemoTeam: {
              connect: {
                side_demoId: { demoId: demoTeam.demoId, side: player.team },
              },
            },
          },
          update: {
            displayName: player.displayName,
            kills: player.kills,
            assists: player.assists,
            deaths: player.deaths,
            headshotPercentage:
              typeof player.headshotPercentage === "number"
                ? new Prisma.Decimal(player.headshotPercentage)
                : null,
          },
        });
      })
    ).then((demoTeamPlayers) => demoTeamPlayers.filter(notNullish));
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
