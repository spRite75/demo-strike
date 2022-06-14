import { Injectable } from "@nestjs/common";
import { concatMap, filter, Subject, merge } from "rxjs";
import { readFile } from "fs/promises";
import { DemoFile } from "demofile";
import { DemoFile as dbDemoFile } from "@prisma/client";
import SteamID from "steamid";
import { CDataGCCStrike15V2MatchInfo } from "demofile/dist/protobufs/cstrike15_gcmessages";
import { DateTime } from "luxon";
import { createHash } from "crypto";

import { DemoFileService } from "src/demo-file/demo-file.service";
import { PrismaService } from "src/prisma/prisma.service";

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
  constructor(public steam64Id: string) {}
  kills = 0;
  assists = 0;
  deaths = 0;
  headshotPercentage = "--%";
}

@Injectable()
export class ParsingService {
  private readonly manualTriggeredDemoFileSubject = new Subject<dbDemoFile>();
  private readonly unparsedDemoFileObservable = merge(
    this.demoFileService.unparsedDemoFileObservable,
    this.manualTriggeredDemoFileSubject
  );

  constructor(
    private demoFileService: DemoFileService,
    private prismaService: PrismaService
  ) {
    // Parse .dem files
    this.unparsedDemoFileObservable
      .pipe(filter(({ filepath }) => filepath.endsWith(".dem")))
      .pipe(
        concatMap<dbDemoFile, Promise<{ demoFile: dbDemoFile; match: Match }>>(
          (demoFileToParse) =>
            new Promise(async (resolve, reject) => {
              const buffer = await readFile(demoFileToParse.filepath);
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
                        new Player(demoPlayer.steam64Id)
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

                const {
                  header: { clientName, serverName, mapName, playbackTicks },
                } = demoFile;

                const playerSteamIds: string[] = [];

                players.forEach((_, steam64Id) =>
                  playerSteamIds.push(steam64Id)
                );

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
                  demoFile: demoFileToParse,
                  match: {
                    id: hash.digest("base64"),
                    clientName,
                    serverName,
                    mapName,
                    players,
                  },
                });
              });

              demoFile.parse(buffer);
            })
        )
      )
      .pipe(
        concatMap(
          async ({
            demoFile: { filepath },
            match: { id, clientName, serverName, mapName, players },
          }) => {
            console.log("got ", filepath);
            await this.prismaService.client.match.create({
              data: {
                id,
                clientName,
                serverName,
                mapName,
                demoFile: { connect: { filepath } },
              },
            });
          }
        )
      );

    // Parse .dem.info files
    this.unparsedDemoFileObservable
      .pipe(filter(({ filepath }) => filepath.endsWith(".dem.info")))
      .pipe(
        concatMap<dbDemoFile, Promise<ParsedDemoInfo>>(
          async (demoInfoFileToParse) => {
            const buffer = await readFile(demoInfoFileToParse.filepath);
            const demoInfoMessage = CDataGCCStrike15V2MatchInfo.decode(buffer);

            const { matchid, matchtime, roundstatsall } = demoInfoMessage;

            const steam64Ids =
              roundstatsall[
                roundstatsall.length - 1
              ]?.reservation?.accountIds.map((steam3Id) =>
                new SteamID(`[U:1:${steam3Id}]`).getSteamID64()
              ) ?? [];

            return {
              officialMatchId: matchid.toString(),
              officialMatchTimestamp: DateTime.fromSeconds(matchtime).toISO(),
              steam64Ids,
            };
          }
        )
      )
      .subscribe({ next: (data) => console.log(data) });
  }

  async parseUnprocessed() {
    const unprocessedDemoFiles =
      await this.prismaService.client.demoFile.findMany({
        where: { parsed: false },
      });

    unprocessedDemoFiles.forEach((demoFile) =>
      this.manualTriggeredDemoFileSubject.next(demoFile)
    );

    return {
      message: `Queued ${unprocessedDemoFiles.length} unprocessed files for parsing.`,
    };
  }
}
