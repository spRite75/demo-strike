export interface ParsedDemoDocument {
  id: string;
  uploadersUids: string[];
  playersSteamIds: string[];
  rounds: ParsedDemoDocument_round[];
  teams: ParsedDemoDocument_team[];
  mapName: string;
  serverName: string;
  playbackTicks: number;
  playbackTime: number;
  steamworksSessionIdServer: string;
}

export interface ParsedDemoDocument_round {
  roundNumber: number;
  events: ParsedDemoDocument_round_event[];
}

export type TeamLetter = "T" | "CT" | "???";
export type SiteLetter = "A" | "B" | "???";

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
        steamId: string;
        team: TeamLetter;
        location: EntityLocation;
      };
      victim: { steamId: string; team: TeamLetter; location: EntityLocation };
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
        steamId: string;
        team: TeamLetter;
        location: EntityLocation;
      };
      victim: { steamId: string; team: TeamLetter; location: EntityLocation };
      weapon: string;
    }
  | {
      eventKind: "BombDroppedEvent";
      location: EntityLocation;
      dropper: { steamId: string };
    }
  | {
      eventKind: "BombPickedUpEvent";
      picker: { steamId: string; location: EntityLocation };
    }
  | {
      eventKind: "BombBeginPlantEvent";
      planter: { steamId: string; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombPlantedEvent";
      planter: { steamId: string; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombBeginDefuseEvent";
      defuser: { steamId: string; hasKit: boolean; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombDefusedEvent";
      defuser: { steamId: string; hasKit: boolean; location: EntityLocation };
      site: SiteLetter;
    }
  | {
      eventKind: "BombExplodedEvent";
      site: SiteLetter;
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
