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
  id: string | undefined;
  uploaderUid: string | undefined;
}

export class ParsedDemo implements IParsedDemo {
  /** Rehydration constructor */
  static fromData({
    isFinal,
    players,
    rounds,
    teams,
    id,
    uploaderUid,
  }: IParsedDemo): ParsedDemo {
    const parsedDemo = new ParsedDemo();
    parsedDemo._isFinal = isFinal;
    parsedDemo.players = players.map(Player.fromData);
    parsedDemo.rounds = rounds.map(Round.fromData);
    parsedDemo.teams = teams.map(Team.fromData);
    parsedDemo._id = id;
    parsedDemo._uploaderUid = uploaderUid;
    return parsedDemo;
  }

  private _id: string | undefined;
  get id() {
    return this._id;
  }
  private _uploaderUid: string | undefined;
  get uploaderUid() {
    return this._uploaderUid;
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
  finalise(fileName: string, uploaderUid: string) {
    if (this._isFinal) throw new Error("Match already finalised!");

    // Set match id
    this._id = fileName;

    // Set uploader id
    this._uploaderUid = uploaderUid;

    // Add players to teams
    this.teams.forEach((team) => {
      team.finalPlayers.push(
        ...this.players.filter(
          (player) => player.finalTeamLetter === team.finalTeamLetter
        )
      );
    });

    // Mark document as final
    this._isFinal = true;
  }
}

const converter: FirestoreDataConverter<ParsedDemo> = {
  toFirestore({
    isFinal,
    players,
    rounds,
    teams,
    id,
    uploaderUid,
  }: ParsedDemo): IParsedDemo {
    const data: IParsedDemo = {
      isFinal,
      players,
      rounds,
      teams,
      id,
      uploaderUid,
    };
    return JSON.parse(JSON.stringify(data));
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ParsedDemo {
    const data = snapshot.data() as IParsedDemo;
    return ParsedDemo.fromData(data);
  },
};

export function parsedDemoCollection() {
  return admin.firestore().collection("parsed-demos").withConverter(converter);
}
