export interface ParsedDemoDocument {
  id: string;
  uploadersUids: string[];
  playersSteamIds: string[];
  rounds: ParsedDemoDocument_round[];
  teams: ParsedDemoDocument_team[];
}

export interface ParsedDemoDocument_round {
  roundNumber: number;
  events: ParsedDemoDocument_round_event[];
}

export type TeamLetter = "T" | "CT" | "???";

export type ParsedDemoDocument_round_event = {
  /** Time from the start of the demo */
  eventTime: number;
} & (
  | {
      eventKind: "RoundStartEvent";
    }
  | {
      eventKind: "DeathEvent";
      attacker: { steamId: string; team: TeamLetter };
      victim: { steamId: string; team: TeamLetter };
      weapon: string;
    }
  | {
      eventKind: "BombPlantedEvent";
      planter: { steamId: string };
      location: string;
    }
  | {
      eventKind: "BombDefusedEvent";
      defuser: { steamId: string };
      location: string;
    }
  | {
      eventKind: "RoundEndEvent";
      phase: string;
      reason: string;
    }
  | {
      eventKind: "RoundOfficialEndEvent";
    }
);

export interface ParsedDemoDocument_team {
  /** Letter for the side on which this team ended the match */
  finalTeamLetter: TeamLetter;
  players: ParsedDemoDocument_team_player[];
  score: ParsedDemoDocument_team_score;
}

export interface ParsedDemoDocument_team_player {
  steamId: string;
  displayName: string;
  playerScore: ParsedDemoDocument_team_player_score;
}

export interface ParsedDemoDocument_team_player_score {
  kills: number;
  deaths: number;
  assists: number;
  score: number;
}

export interface ParsedDemoDocument_team_score {
  firstHalf: number;
  secondHalf: number;
  total: number;
}
