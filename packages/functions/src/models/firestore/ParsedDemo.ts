import { IPlayerRoundStats } from "demofile";

export interface ParsedDemoDocument {
  id: string;
  uploadersUids: string[];
  playersSteam64Ids: string[];
  rounds: ParsedDemoDocument_round[];
  teams: ParsedDemoDocument_team[];
  mapName: string;
  serverName: string;
  playbackTicks: number;
  playbackTime: number;
  lastModifiedTimestamp: string;
  matchTimestamp: string;
  steamworksSessionIdServer: string;
}

export interface ParsedDemoDocument_round {
  roundNumber: number;
  events: ParsedDemoDocument_round_event[];
}

export type TeamLetter = "T" | "CT" | "???";
export type SiteLetter = "A" | "B" | "???";
export type RoundEndReason =
  | "TargetBombed"
  | "BombDefused"
  | "CTWin"
  | "TerroristWin"
  | "Draw"
  | "HostagesRescued"
  | "HostagesNotRescued"
  | "GameStart"
  | "TerroristsSurrender"
  | "CTSurrender"
  | "Unknown";

export interface EntityLocation {
  x: number;
  y: number;
  z: number;
  name: string;
}

export type ParsedDemoDocument_round_event = {
  /** Time from the start of the demo */
  eventTime: number;
} & (
  | {
      eventKind: "RoundStartEvent";
    }
  | {
      eventKind: "PlayerHurtEvent";
      attacker?: {
        steam64Id: string;
        team: TeamLetter;
        location: EntityLocation;
      };
      victim: { steam64Id: string; team: TeamLetter; location: EntityLocation };
      health: number;
      armor: number;
      dmgHealth: number;
      dmgArmor: number;
      hitGroup: number;
      weapon: string;
    }
  | {
      eventKind: "DeathEvent";
      attacker?: {
        steam64Id: string;
        team: TeamLetter;
        location: EntityLocation;
      };
      victim: { steam64Id: string; team: TeamLetter; location: EntityLocation };
      weapon: string;
    }
  | {
      eventKind: "BombDroppedEvent";
      location: EntityLocation;
      dropper: { steam64Id: string };
    }
  | {
      eventKind: "BombPickedUpEvent";
      picker: { steam64Id: string; location: EntityLocation };
    }
  | {
      eventKind: "BombBeginPlantEvent";
      planter: { steam64Id: string; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombPlantedEvent";
      planter: { steam64Id: string; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombBeginDefuseEvent";
      defuser: { steam64Id: string; hasKit: boolean; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombDefusedEvent";
      defuser: { steam64Id: string; hasKit: boolean; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombExplodedEvent";
      site: SiteLetter;
    }
  | {
      eventKind: "RoundEndEvent";
      phase: string;
      reason: RoundEndReason;
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
  steam64Id: string;
  displayName: string;
  playerScore: ParsedDemoDocument_team_player_score;
  playerRoundStats: ({ roundNumber: number } & IPlayerRoundStats)[];
}

export interface ParsedDemoDocument_team_player_score {
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  mvps: number;
}

export interface ParsedDemoDocument_team_score {
  firstHalf: number;
  secondHalf: number;
  total: number;
}
