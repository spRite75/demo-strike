import { BaseEntity, DemoFile, Player } from "demofile";
import * as functions from "firebase-functions";
import {
  ParsedDemoDocument,
  ParsedDemoDocument_team_score,
  TeamLetter,
  EntityLocation,
} from "../models/firestore/parsedDemo";
import { ParsedDemoWriter } from "./parsedDemoWriter";

function getTeamLetter(teamNumber?: number): TeamLetter {
  switch (teamNumber) {
    case 2:
      return "T";
    case 3:
      return "CT";
    default:
      return "???";
  }
}

function getLocation(entity: BaseEntity | Player): EntityLocation {
  return {
    ...entity.position,
    name: entity instanceof Player ? entity.placeName : "",
  };
}

export async function parseDemo(opts: {
  fileName: string;
  uploaderUid: string;
  demoBuffer: Buffer;
}) {
  const { fileName, uploaderUid, demoBuffer } = opts;

  return new Promise<ParsedDemoDocument>(async (resolve, reject) => {
    const demoWriter = new ParsedDemoWriter();

    const demoFile = new DemoFile();

    // Useful bits of demo state
    const state = {
      getRound: () =>
        demoFile.gameRules.isWarmup ? 0 : demoFile.gameRules.roundsPlayed + 1,
      getTime: () => demoFile.currentTime,
      getPhase: () => demoFile.gameRules.phase,
    };

    const unhandledEventKinds: {
      [eventName: string]: { [key: string]: string };
    } = {};

    demoFile.gameEvents.on("event", ({ name, event }) => {
      switch (name) {
        case "round_start": {
          // Any player present at the start of a round
          // should be added and have their team updated
          demoFile.players.forEach((demoPlayer) => {
            const playerTeamLetter = getTeamLetter(demoPlayer.teamNumber);
            if (demoPlayer.isFakePlayer) return;

            demoWriter.addPlayer(demoPlayer.steamId, demoPlayer.name);
            demoWriter.setPlayerTeam(
              demoPlayer.steamId,
              state.getPhase(),
              playerTeamLetter
            );
          });

          demoWriter.recordEvent(state.getRound(), {
            eventTime: state.getTime(),
            eventKind: "RoundStartEvent",
          });
          break;
        }

        case "player_hurt": {
          const {
            armor,
            dmg_armor: dmgArmor,
            dmg_health: dmgHealth,
            health,
            hitgroup: hitGroup,
            weapon,
          } = event;
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "PlayerHurtEvent",
            eventTime: state.getTime(),
            victim: {
              steamId: event.player.steamId,
              team: getTeamLetter(event.player.teamNumber),
              location: {
                x: event.player.position.x,
                y: event.player.position.y,
                z: event.player.position.z,
                name: event.player.placeName,
              },
            },
            attacker: event.attackerEntity
              ? {
                  steamId: event.attackerEntity.steamId,
                  team: getTeamLetter(event.attackerEntity.teamNumber),
                  location: getLocation(event.attackerEntity),
                }
              : undefined,
            armor,
            dmgArmor,
            dmgHealth,
            health,
            hitGroup,
            weapon,
          });
        }

        case "player_death": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "DeathEvent",
            eventTime: state.getTime(),
            attacker: event.attackerEntity
              ? {
                  steamId: event.attackerEntity?.steamId || "UNKNOWN",
                  team: getTeamLetter(event.attackerEntity?.teamNumber),
                  location: {
                    ...event.attackerEntity.position,
                    name: event.attackerEntity.placeName,
                  },
                }
              : undefined,
            victim: {
              steamId: event.player.steamId,
              team: getTeamLetter(event.player.teamNumber),
              location: {
                ...event.player.position,
                name: event.player.placeName,
              },
            },
            weapon: event.weapon,
          });
          break;
        }

        case "bomb_dropped": {
          demoWriter.recordEvent(state.getRound(), {
            eventTime: state.getTime(),
            eventKind: "BombDroppedEvent",
            location: {
              ...event.entity.position,
              name: event.player.placeName,
            },
            dropper: { steamId: event.player.steamId },
          });
          break;
        }

        case "bomb_pickup": {
          demoWriter.recordEvent(state.getRound(), {
            eventTime: state.getTime(),
            eventKind: "BombPickedUpEvent",
            picker: {
              steamId: event.player.steamId,
              location: getLocation(event.player),
            },
          });
          break;
        }

        case "bomb_beginplant": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombBeginPlantEvent",
            eventTime: state.getTime(),
            planter: {
              steamId: event.player.steamId,
              location: {
                ...event.player.position,
                name: event.player.placeName,
              },
            },
            site: `???`, // event.site
          });
          break;
        }

        case "bomb_planted": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombPlantedEvent",
            eventTime: state.getTime(),
            planter: {
              steamId: event.player.steamId,
              location: {
                ...event.player.position,
                name: event.player.placeName,
              },
            },
            site: `???`, // event.site
          });
          break;
        }

        case "bomb_begindefuse": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombBeginDefuseEvent",
            eventTime: state.getTime(),
            defuser: {
              steamId: event.player.steamId,
              hasKit: event.player.hasDefuser,
              location: {
                ...event.player.position,
                name: event.player.placeName,
              },
            },
            site: `???`, // event.site
          });
          break;
        }

        case "bomb_defused": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombDefusedEvent",
            eventTime: state.getTime(),
            defuser: {
              steamId: event.player.steamId,
              hasKit: event.player.hasDefuser,
              location: {
                ...event.player.position,
                name: event.player.placeName,
              },
            },
            site: `???`, // event.site
          });
          break;
        }

        case "bomb_exploded": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombExplodedEvent",
            eventTime: state.getTime(),
            site: `???`, // event.site
          });
          break;
        }

        // Round ends and a team has won the round
        case "round_end": {
          // Save player scores
          demoFile.players.forEach((demoPlayer) => {
            const { score, kills, assists, deaths } = demoPlayer;
            demoWriter.updatePlayerScore(
              demoPlayer.steamId,
              (currentScore) => ({
                ...currentScore,
                score,
                kills,
                assists,
                deaths,
              })
            );
          });

          demoWriter.recordEvent(state.getRound(), {
            eventKind: "RoundEndEvent",
            eventTime: state.getTime(),
            phase: demoFile.gameRules.phase,
            reason: event.reason.toString(),
          });
          break;
        }

        // After round time reset
        case "round_officially_ended": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "RoundOfficialEndEvent",
            eventTime: state.getTime(),
          });
          break;
        }

        // Prepare to log unhandled event kinds with some basic info about what they contain
        default: {
          unhandledEventKinds[name] = Object.keys(event).reduce<{
            [key: string]: string;
          }>((acc, key) => {
            acc[key] = typeof (event as any)[key];
            return acc;
          }, {});
        }
      }
    });

    demoFile.on("error", (error) => {
      reject(error);
    });

    demoFile.on("end", (e) => {
      functions.logger.warn("unprocessed gameEvents", { unhandledEventKinds });

      if (e.error) {
        console.error("Error during parsing:", e.error);
        reject(e.error);
      }

      const finalTeamScores: {
        CT: ParsedDemoDocument_team_score;
        T: ParsedDemoDocument_team_score;
      } = {
        CT: { firstHalf: 0, secondHalf: 0, total: 0 },
        T: { firstHalf: 0, secondHalf: 0, total: 0 },
      };

      demoFile.teams.forEach((team) => {
        const teamLetter = getTeamLetter(team.teamNumber);
        if (teamLetter === "???") return;

        finalTeamScores[teamLetter] = {
          firstHalf: team.scoreFirstHalf,
          secondHalf: team.scoreSecondHalf,
          total: team.score,
        };
      });

      const {
        header: { mapName, serverName, playbackTicks, playbackTime },
        conVars: { vars },
      } = demoFile;
      const steamworksSessionIdServer =
        vars.get("steamworks_sessionid_server") ?? "";

      demoWriter.finalise({
        fileName,
        uploaderUid,
        finalTeamScores,
        mapName,
        serverName,
        playbackTicks,
        playbackTime,
        steamworksSessionIdServer,
      });
      resolve(demoWriter.get());
    });

    // Start parsing now that we've added our event listeners
    demoFile.parse(demoBuffer);
  });
}
