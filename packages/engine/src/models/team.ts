import { Player } from './player';
import { TeamLetter } from './team-letter';

export class Team {
  readonly finalPlayers: Player[] = []
  constructor(
    public readonly finalTeamLetter: TeamLetter,
    public readonly score: {
      firstHalf: number;
      secondHalf: number;
      total: number;
    },
  ) {}
}
