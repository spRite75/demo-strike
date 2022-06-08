import { BaseEntity, DemoFile, Player } from "demofile";
import * as functions from "firebase-functions";
import {
  ParsedDemoData_team_score,
  TeamLetter,
  EntityLocation,
  ParsedDemoData,
} from "../models/firestore/ParsedDemo";
import { ParsedDemoWriter } from "./ParsedDemoWriter";

enum DemoRoundEndReason {
  TargetBombed = 1, // Target Successfully Bombed!
  // 2/3 not in use in CSGO
  TerroristsEscaped = 4, // The terrorists have escaped!
  CTStoppedEscape = 5, // The CTs have prevented most of the terrorists from escaping!
  TerroristsStopped = 6, // Escaping terrorists have all been neutralized!
  BombDefused = 7, // The bomb has been defused!
  CTWin = 8, // Counter-Terrorists Win!
  TerroristWin = 9, // Terrorists Win!
  Draw = 10, // Round Draw!
  HostagesRescued = 11, // All Hostages have been rescued!
  TargetSaved = 12, // Target has been saved!
  HostagesNotRescued = 13, // Hostages have not been rescued!
  TerroristsNotEscaped = 14, // Terrorists have not escaped!
  GameStart = 16, // Game Commencing!
  // 15 not in use in CSGO
  TerroristsSurrender = 17, // Terrorists Surrender
  CTSurrender = 18, // CTs Surrender
  TerroristsPlanted = 19, // Terrorists Planted the bomb
  CTsReachedHostage = 20, // CTs Reached the hostage
}

function getRoundEndReason(reasonValue: DemoRoundEndReason) {
  switch (reasonValue) {
    case DemoRoundEndReason.TargetBombed:
      return "TargetBombed";
    case DemoRoundEndReason.BombDefused:
      return "BombDefused";
    case DemoRoundEndReason.CTWin:
      return "CTWin";
    case DemoRoundEndReason.TerroristWin:
      return "TerroristWin";
    case DemoRoundEndReason.Draw:
      return "Draw";
    case DemoRoundEndReason.HostagesRescued:
      return "HostagesRescued";
    case DemoRoundEndReason.HostagesNotRescued:
      return "HostagesNotRescued";
    case DemoRoundEndReason.GameStart:
      return "GameStart";
    case DemoRoundEndReason.TerroristsSurrender:
      return "TerroristsSurrender";
    case DemoRoundEndReason.CTSurrender:
      return "CTSurrender";
    default:
      return "Unknown";
  }
}

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

export async function parseDemo(demoBuffer: Buffer) {
  return new Promise<ParsedDemoData>(async (resolve, reject) => {
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
      const round = state.getRound();
      const eventTime = state.getTime();
      switch (name) {
        case "round_start": {
          // Any player present at the start of a round
          // should be added and have their team updated
          demoFile.players.forEach((demoPlayer) => {
            const playerTeamLetter = getTeamLetter(demoPlayer.teamNumber);
            if (demoPlayer.isFakePlayer) return;
            demoWriter.addPlayer(demoPlayer.steam64Id, demoPlayer.name);
            demoWriter.setPlayerTeam(
              demoPlayer.steam64Id,
              state.getPhase(),
              playerTeamLetter
            );
          });

          demoWriter.recordEvent(state.getRound(), {
            eventTime,
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
            eventTime,
            victim: {
              steam64Id: event.player.steam64Id,
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
                  steam64Id: event.attackerEntity.steam64Id,
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
            eventTime,
            attacker: event.attackerEntity
              ? {
                  steam64Id: event.attackerEntity?.steam64Id || "UNKNOWN",
                  team: getTeamLetter(event.attackerEntity?.teamNumber),
                  location: {
                    ...event.attackerEntity.position,
                    name: event.attackerEntity.placeName,
                  },
                }
              : undefined,
            victim: {
              steam64Id: event.player.steam64Id,
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
            eventTime,
            eventKind: "BombDroppedEvent",
            location: {
              ...event.entity.position,
              name: event.player.placeName,
            },
            dropper: { steam64Id: event.player.steam64Id },
          });
          break;
        }

        case "bomb_pickup": {
          demoWriter.recordEvent(state.getRound(), {
            eventTime,
            eventKind: "BombPickedUpEvent",
            picker: {
              steam64Id: event.player.steam64Id,
              location: getLocation(event.player),
            },
          });
          break;
        }

        case "bomb_beginplant": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombBeginPlantEvent",
            eventTime,
            planter: {
              steam64Id: event.player.steam64Id,
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
            eventTime,
            planter: {
              steam64Id: event.player.steam64Id,
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
            eventTime,
            defuser: {
              steam64Id: event.player.steam64Id,
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
            eventTime,
            defuser: {
              steam64Id: event.player.steam64Id,
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
            eventTime,
            site: `???`, // event.site
          });
          break;
        }

        // Round ends and a team has won the round
        case "round_end": {
          // Save player scores
          demoFile.players.forEach((demoPlayer) => {
            const {
              steam64Id,
              score,
              kills,
              assists,
              deaths,
              mvps,
              matchStats,
            } = demoPlayer;
            demoWriter.updatePlayerScore(steam64Id, (currentScore) => ({
              ...currentScore,
              score,
              kills,
              assists,
              deaths,
              mvps,
            }));
            demoWriter.addPlayerRoundStats(
              steam64Id,
              round,
              matchStats[round - 2]
            );
          });

          demoWriter.recordEvent(round, {
            eventKind: "RoundEndEvent",
            eventTime,
            phase: demoFile.gameRules.phase,
            reason: getRoundEndReason(event.reason),
          });
          break;
        }

        // After round time reset
        case "round_officially_ended": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "RoundOfficialEndEvent",
            eventTime,
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
        CT: ParsedDemoData_team_score;
        T: ParsedDemoData_team_score;
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
