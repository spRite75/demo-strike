import { IPlayerRoundStats } from "demofile";

export type ParsedDemoDocument = ParsedDemoMeta & ParsedDemoData;

export interface ParsedDemoMeta {
  id: string;
  officialMatchTimestamp?: string;
}

export interface ParsedDemoData {
  playersSteam64Ids: string[];
  rounds: ParsedDemoData_round[];
  teams: ParsedDemoData_team[];
  mapName: string;
  serverName: string;
  playbackTicks: number;
  playbackTime: number;
  steamworksSessionIdServer: string;
}

export interface ParsedDemoData_round {
  roundNumber: number;
  events: ParsedDemoData_round_event[];
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

export type ParsedDemoData_round_event = {
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

export interface ParsedDemoData_team {
  /** Letter for the side on which this team ended the match */
  finalTeamLetter: TeamLetter;
  players: ParsedDemoData_team_player[];
  score: ParsedDemoData_team_score;
}

export interface ParsedDemoData_team_player {
  steam64Id: string;
  displayName: string;
  playerScore: ParsedDemoData_team_player_score;
  playerRoundStats: ({ roundNumber: number } & IPlayerRoundStats)[];
}

export interface ParsedDemoData_team_player_score {
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  mvps: number;
}

export interface ParsedDemoData_team_score {
  firstHalf: number;
  secondHalf: number;
  total: number;
}
