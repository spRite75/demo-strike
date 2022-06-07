import fetch from "node-fetch";
import * as functions from "firebase-functions";
import { chunk } from "./utils";

function apiKey() {
  if (!process.env.STEAM_WEB_API_KEY)
    throw new Error("STEAM_WEB_API_KEY not set");
  else return process.env.STEAM_WEB_API_KEY;
}

interface IGetPlayerSummariesResponse {
  response: {
    players: {
      /** steam64Id */
      steamid: string;
      profileurl: string;
      avatar: string;
      avatarmedium: string;
      avatarfull: string;
    }[];
  };
}

interface PlayerSummary {
  profileUrl: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
}

/**
 * Calls the ISteamUser.GetPlayerSummaries API to retrieve some public profile information
 *
 * https://partner.steamgames.com/doc/webapi/ISteamUser#GetPlayerSummaries
 * @param steam64Ids steam64Ids to get information for
 */
export async function getPlayerSummaries(
  steam64Ids: string[]
): Promise<Map<string, PlayerSummary>> {
  const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`;

  const playerSummaries = new Map<string, PlayerSummary>();
  const steam64IdChunks = chunk(steam64Ids, 75);

  for (const steam64Ids of steam64IdChunks) {
    const response = await fetch(
      `${apiUrl}?key=${apiKey()}&steamids=${steam64Ids.join(",")}`
    );
    if (response.ok) {
      const json = (await response.json()) as IGetPlayerSummariesResponse;
      json.response.players.forEach((player) =>
        playerSummaries.set(player.steamid, {
          profileUrl: player.profileurl,
          avatar: player.avatar,
          avatarMedium: player.avatarmedium,
          avatarFull: player.avatarfull,
        })
      );
    } else {
      functions.logger.error(
        `ISteamUser.GetPlayerSummaries call failed (status: ${response.status} ${response.statusText})`,
        await response.json()
      );
    }
  }

  return playerSummaries;
}
