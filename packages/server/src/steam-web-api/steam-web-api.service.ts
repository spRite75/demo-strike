import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import fetch from "node-fetch";
import { chunk } from "src/utils";

interface IGetPlayerSummariesResponse {
  response: {
    players: {
      /** steam64Id */
      steamid: string;
      personaname: string;
      profileurl: string;
      avatar: string;
      avatarmedium: string;
      avatarfull: string;
    }[];
  };
}

interface PlayerSummary {
  displayName: string;
  profileUrl: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
}
@Injectable()
export class SteamWebApiService {
  private readonly logger = new Logger(SteamWebApiService.name);
  constructor(private configService: ConfigService) {}

  private readonly apiKey = this.configService.getOrThrow("STEAM_WEB_API_KEY");

  async getPlayerSummaries(steam64Ids: string[]) {
    this.logger.verbose(`getting ${steam64Ids.length} player summaries`);
    const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`;

    const playerSummaries = new Map<string, PlayerSummary>();
    const steam64IdChunks = chunk(steam64Ids, 75);

    for (const steam64Ids of steam64IdChunks) {
      const response = await fetch(
        `${apiUrl}?key=${this.apiKey}&steamids=${steam64Ids.join(",")}`
      );
      if (response.ok) {
        const json = (await response.json()) as IGetPlayerSummariesResponse;
        json.response.players.forEach((player) =>
          playerSummaries.set(player.steamid, {
            displayName: player.personaname,
            profileUrl: player.profileurl,
            avatar: player.avatar,
            avatarMedium: player.avatarmedium,
            avatarFull: player.avatarfull,
          })
        );
      } else {
        this.logger.error(
          `ISteamUser.GetPlayerSummaries call failed (status: ${response.status} ${response.statusText})`,
          await response.json()
        );
      }
    }

    this.logger.verbose(`got ${steam64Ids.length} player summaries`);
    return playerSummaries;
  }
}
