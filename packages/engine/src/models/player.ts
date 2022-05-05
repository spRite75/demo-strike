import { TeamLetter } from './team-letter';

export class Player {
  constructor(public readonly steamId: string, public displayName: string) {}

  kills: number = 0;
  deaths: number = 0;
  assists: number = 0;
  score: number = 0;

  setScores(props: {
    kills: number;
    deaths: number;
    assists: number;
    score: number;
  }) {
    this.kills = props.kills;
    this.deaths = props.deaths;
    this.assists = props.assists;
    this.score = props.score;
  }

  finalTeamLetter: TeamLetter = '???';
  setTeam(phase: string, teamLetter: TeamLetter) {
    switch (phase) {
      case 'first':
        switch (teamLetter) {
          case 'CT':
            this.finalTeamLetter = 'T';
            break;
          case 'T':
            this.finalTeamLetter = 'CT';
            break;
        }
        break;
      case 'second':
        this.finalTeamLetter = teamLetter
        break;
    }
  }
}
