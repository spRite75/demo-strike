import { DemoFile } from "demofile";
import * as functions from "firebase-functions";
import {
  ParsedDemoDocument,
  ParsedDemoDocument_team_score,
  TeamLetter,
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
            demoWriter.addPlayer(demoPlayer.steamId, demoPlayer.name);
            demoWriter.setPlayerTeam(
              demoPlayer.steamId,
              state.getPhase(),
              getTeamLetter(demoPlayer.teamNumber)
            );
          });

          demoWriter.recordEvent(state.getRound(), {
            eventTime: state.getTime(),
            eventKind: "RoundStartEvent",
          });
          break;
        }

        case "player_death": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "DeathEvent",
            eventTime: state.getTime(),
            attacker: {
              steamId: event.attackerEntity?.steamId || "UNKNOWN",
              team: getTeamLetter(event.attackerEntity?.teamNumber),
            },
            victim: {
              steamId: event.player.steamId,
              team: getTeamLetter(event.player.teamNumber),
            },
            weapon: event.weapon,
          });
          break;
        }

        case "bomb_planted": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombPlantedEvent",
            eventTime: state.getTime(),
            planter: { steamId: event.player.steamId },
            location: event.player.placeName,
          });
          break;
        }

        case "bomb_defused": {
          demoWriter.recordEvent(state.getRound(), {
            eventKind: "BombDefusedEvent",
            eventTime: state.getTime(),
            defuser: { steamId: event.player.steamId },
            location: event.player.placeName,
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

    demoFile.on("end", (e) => {
      functions.logger.warn("unprocesssed gameEvents", { unhandledEventKinds });

      if (e.error) {
        console.error("Error during parsing:", e.error);
        process.exitCode = 1;
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

      demoWriter.finalise({ fileName, uploaderUid, finalTeamScores });
      resolve(demoWriter.get());
    });

    // Start parsing now that we've added our event listeners
    demoFile.parse(demoBuffer);
  });
}
