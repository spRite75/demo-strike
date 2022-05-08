import { Player } from "./Player";
import { TeamLetter } from "./TeamLetter";

export interface ITeam {
  readonly finalTeamLetter: TeamLetter;
  readonly finalPlayers: Player[];
  readonly score: {
    firstHalf: number;
    secondHalf: number;
    total: number;
  };
}

export class Team implements ITeam {
  /** Rehydration constructor */
  static fromData({ finalPlayers, finalTeamLetter, score }: ITeam): Team {
    const team = new Team(finalTeamLetter, score);
    team.finalPlayers.push(...finalPlayers);
    return team;
  }

  readonly finalPlayers: Player[] = [];

  constructor(
    public readonly finalTeamLetter: TeamLetter,
    public readonly score: {
      firstHalf: number;
      secondHalf: number;
      total: number;
    }
  ) {}
}
