import { DemoFile } from "demofile";
import { ParsedDemo } from "../models/firestore/ParsedDemo";
import { TeamLetter } from "../models/firestore/ParsedDemo/TeamLetter";

export class ParsingService {
  private getTeamLetter(teamNumber?: number): TeamLetter {
    switch (teamNumber) {
      case 2:
        return "T";
      case 3:
        return "CT";
      default:
        return "???";
    }
  }

  async parseDemo({
    fileName,
    uploaderUid,
    demoStream,
  }: {
    fileName: string;
    uploaderUid: string;
    demoStream: Buffer;
  }): Promise<ParsedDemo> {
    return new Promise(async (resolve, reject) => {
      const match = new ParsedDemo();
      let demoState = { roundNumber: 0 };
      const demoFile = new DemoFile();

      const getTime = () => demoFile.currentTime;

      demoFile.gameEvents.on("player_connect_full", (e) => {
        const {
          player: { steamId, name, team },
        } = e;
        const teamId = team?.handle;
        if (!teamId) return;
        match.addPlayer(steamId, name);
      });

      demoFile.gameEvents.on("round_start", () => {
        if (!demoFile.gameRules.isWarmup) {
          demoState = {
            ...demoState,
            roundNumber: demoFile.gameRules.roundsPlayed + 1,
          };
        }

        demoFile.players.forEach((demoPlayer) => {
          const matchPlayer = match.players.find(
            (p) => p.steamId === demoPlayer.steamId
          );
          if (!matchPlayer) return;

          // Update player team
          matchPlayer.setTeam(
            demoFile.gameRules.phase,
            this.getTeamLetter(demoPlayer.teamNumber)
          );
        });

        match.recordEvent(demoState.roundNumber, {
          eventKind: "RoundStartEvent",
          eventTime: getTime(),
          roundNumber: demoState.roundNumber,
        });
      });

      demoFile.gameEvents.on("player_death", (e) => {
        match.recordEvent(demoState.roundNumber, {
          eventKind: "DeathEvent",
          eventTime: getTime(),
          attacker: {
            steamId: e.attackerEntity?.steamId || "UNKNOWN",
            name: e.attackerEntity?.name || "UNKNOWN",
            team: this.getTeamLetter(e.attackerEntity?.teamNumber),
          },
          victim: {
            steamId: e.player.steamId,
            name: e.player.name,
            team: this.getTeamLetter(e.player.teamNumber),
          },
          weapon: e.weapon,
        });
      });

      demoFile.gameEvents.on("bomb_planted", (e) => {
        match.recordEvent(demoState.roundNumber, {
          eventKind: "BombPlantedEvent",
          eventTime: getTime(),
          planter: { steamId: e.player.steamId, name: e.player.name },
          location: e.player.placeName,
        });
      });

      demoFile.gameEvents.on("round_end", (e) => {
        demoFile.players.forEach((demoPlayer) => {
          const matchPlayer = match.players.find(
            (p) => p.steamId === demoPlayer.steamId
          );
          if (!matchPlayer) return;

          // Save player scores
          const { kills, assists, deaths, score } = demoPlayer;
          matchPlayer.setScores({ kills, assists, deaths, score });
        });

        match.recordEvent(demoState.roundNumber, {
          eventKind: "RoundEndEvent",
          eventTime: getTime(),
          phase: demoFile.gameRules.phase,
          reason: e.reason.toString(),
        });
      });

      demoFile.gameEvents.on("round_officially_ended", () => {
        match.recordEvent(demoState.roundNumber, {
          eventKind: "RoundOfficialEndEvent",
          eventTime: getTime(),
        });
      });

      demoFile.on("end", (e) => {
        if (e.error) {
          console.error("Error during parsing:", e.error);
          process.exitCode = 1;
        }

        // Create teams
        demoFile.teams.forEach((team) => {
          const teamLetter = this.getTeamLetter(team.teamNumber);
          if (teamLetter === "???") return;

          match.addTeam(teamLetter, {
            firstHalf: team.scoreFirstHalf,
            secondHalf: team.scoreSecondHalf,
            total: team.score,
          });
        });

        // Do any finalisation on the match object
        match.finalise(fileName, uploaderUid);

        // Here's where we return the built up match object
        resolve(match);
      });

      // Start parsing the stream now that we've added our event listeners
      demoFile.parse(demoStream);
    });
  }
}
