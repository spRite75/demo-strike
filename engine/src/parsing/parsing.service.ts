import { Injectable } from '@nestjs/common';
import { ReadStream } from 'fs';
import { DemoFile } from 'demofile';
import { Match } from 'src/models/match';
import { TeamLetter } from 'src/models/team-letter';

@Injectable()
export class ParsingService {
  private getTeamLetter(teamNumber?: number): TeamLetter {
    switch (teamNumber) {
        case 2: return "T"
        case 3: return "CT"
        default: return "???"
    }
  }

  async parseDemo(demoStream: ReadStream): Promise<Match> {
    return new Promise(async (resolve, reject) => {
      const match = new Match();
      let demoState = { roundNumber: 0 };
      const demoFile = new DemoFile();

      const getTime = () => demoFile.currentTime

      demoFile.gameEvents.on("round_start", () => {
        if (!demoFile.gameRules.isWarmup) {
          demoState = { ...demoState, roundNumber: demoFile.gameRules.roundsPlayed + 1};
        }

        match.recordEvent(demoState.roundNumber, {
          eventKind: "RoundStartEvent",
          eventTime: getTime(),
          roundNumber: demoState.roundNumber
        })
      });

      demoFile.gameEvents.on('player_death', (e) => {
        match.recordEvent(demoState.roundNumber, {
          eventKind: 'DeathEvent',
          eventTime: getTime(),
          attacker: {
            steamId: e.attackerEntity?.steamId || 'UNKNOWN',
            name: e.attackerEntity?.name || 'UNKNOWN',
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

      demoFile.gameEvents.on('bomb_planted', (e) => {
        match.recordEvent(demoState.roundNumber, {
          eventKind: 'BombPlantedEvent',
          eventTime: getTime(),
          planter: { steamId: e.player.steamId, name: e.player.name },
          location: e.player.placeName
        });
      });

      demoFile.gameEvents.on("round_end", (e) => {
        match.recordEvent(demoState.roundNumber, {
            eventKind: "RoundEndEvent",
            eventTime: getTime(),
            phase: demoFile.gameRules.phase,
            reason: e.reason.toString()
        });
      });

      demoFile.gameEvents.on("round_officially_ended", () => {
        match.recordEvent(demoState.roundNumber, {
            eventKind: "RoundOfficialEndEvent",
            eventTime: getTime()
        });
      });

      demoFile.on('end', (e) => {
        if (e.error) {
          console.error('Error during parsing:', e.error);
          process.exitCode = 1;
        }

        

        // Here's where we return the built up match object
        resolve(match);
      });

      // Start parsing the stream now that we've added our event listeners
      demoFile.parseStream(demoStream);
    });
  }
}
