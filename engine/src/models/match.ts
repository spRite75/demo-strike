import { RoundEvent } from './events';
import { Player } from './player';
import { Round } from './round';

export class Match {
  players: Player[] = [];
  rounds: Round[] = [];

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
}
