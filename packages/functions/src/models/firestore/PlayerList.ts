export interface PlayerListDocument {
  steam64Id: string;
  displayName: string;
  demoCount: number;
  lastPlayedTimestamp: string;
  profileUrl?: string;
  avatarUrl?: {
    default: string;
    medium: string;
    full: string;
  };
}
