export interface ProfileDocument {
  readonly id: string;
  displayName: string;
  steamId?: string;
  parsedDemos: string[];
}
