import { Team } from './team';
import { RoundEvent } from './events';
import { Round } from './round';
import { Player } from './player';
import { TeamLetter } from './team-letter';

export class Match {
  players: Player[] = [];
  teams: Team[] = [];
  rounds: Round[] = [];

  addPlayer(steamId: string, displayName: string) {
    const doesPlayerExist = this.players.some(
      (player) => player.steamId === steamId,
    );
    if (doesPlayerExist) return;
    this.players.push(new Player(steamId, displayName));
  }

  addTeam(teamLetter: TeamLetter, score: Team['score']) {
    this.teams.push(new Team(teamLetter, score));
  }

  private getRound(roundNumber: number): Round {
    const round = this.rounds.find(
      (round) => round.roundNumber === roundNumber,
    );
    if (!round) {
      this.rounds.push(new Round(roundNumber));
      return this.getRound(roundNumber);
    }
    return round;
  }

  recordEvent(roundNumber: number, event: RoundEvent) {
    const round = this.getRound(roundNumber);
    round.addEvent(event);
  }

  print() {
    this.rounds
      .sort((a, b) => a.roundNumber - b.roundNumber)
      .forEach((round) => {
        console.log('\n');
        round.print();
      });
  }

  private isFinal = false;
  finalise() {
    if (this.isFinal) throw new Error('Match already finalised!');

    // Add players to teams
    this.teams.forEach((team) => {
      team.finalPlayers.push(
        ...this.players.filter(
          (player) => player.finalTeamLetter === team.finalTeamLetter,
        ),
      );
    });
  }
}
