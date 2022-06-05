export interface ProfileDocument {
  readonly id: string;
  displayName: string;
  steam64Id: string;
  parsedDemos: string[];
}
