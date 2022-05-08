import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { RoundEvent } from "./events";
import { IPlayer, Player } from "./Player";
import { IRound, Round } from "./Round";
import { ITeam, Team } from "./Team";
import { TeamLetter } from "./TeamLetter";

export interface IParsedDemo {
  players: IPlayer[];
  teams: ITeam[];
  rounds: IRound[];
  isFinal: boolean;
}

export class ParsedDemo implements IParsedDemo {
  /** Rehydration constructor */
  static fromData({
    isFinal,
    players,
    rounds,
    teams,
  }: IParsedDemo): ParsedDemo {
    const parsedDemo = new ParsedDemo();
    parsedDemo._isFinal = isFinal;
    parsedDemo.players = players.map(Player.fromData);
    parsedDemo.rounds = rounds.map(Round.fromData);
    parsedDemo.teams = teams.map(Team.fromData);
    return parsedDemo;
  }

  players: Player[] = [];
  teams: Team[] = [];
  rounds: Round[] = [];

  addPlayer(steamId: string, displayName: string) {
    const doesPlayerExist = this.players.some(
      (player) => player.steamId === steamId
    );
    if (doesPlayerExist) return;
    this.players.push(new Player(steamId, displayName));
  }

  addTeam(teamLetter: TeamLetter, score: Team["score"]) {
    this.teams.push(new Team(teamLetter, score));
  }

  private getRound(roundNumber: number): Round {
    const round = this.rounds.find(
      (round) => round.roundNumber === roundNumber
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
        console.log("\n");
        round.print();
      });
  }

  private _isFinal = false;
  get isFinal() {
    return this._isFinal;
  }
  finalise() {
    if (this._isFinal) throw new Error("Match already finalised!");

    // Add players to teams
    this.teams.forEach((team) => {
      team.finalPlayers.push(
        ...this.players.filter(
          (player) => player.finalTeamLetter === team.finalTeamLetter
        )
      );
    });
  }
}

const converter: FirestoreDataConverter<ParsedDemo> = {
  toFirestore({ isFinal, players, rounds, teams }: ParsedDemo): IParsedDemo {
    return { isFinal, players, rounds, teams };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ParsedDemo {
    const data = snapshot.data() as IParsedDemo;
    return ParsedDemo.fromData(data);
  },
};

export function profileCollection() {
  return admin.firestore().collection("parsed-demos").withConverter(converter);
}
