import {
  ParsedDemoDocument,
  parsedDemosCollection,
} from "../../../models/firestore";
import { notNullish } from "../../../utils";
import {
  MatchType,
  PlayerMatch,
  QueryResolvers,
} from "../../generated/graphql";
import * as functions from "firebase-functions";
import { DateTime } from "luxon";

export const matches: QueryResolvers["matches"] = async (
  _,
  { params: { playerSteam64Id } },
  ___
) => {
  function convertParsedDemoToPlayerMatch(
    demo: ParsedDemoDocument | null
  ): PlayerMatch | null {
    if (!demo) return null;
    if (demo.teams.length !== 2) {
      functions.logger.error("Invalid number of teams in demo", {
        id: demo.id,
      });
      return null;
    }
    const friendlyTeam = demo.teams.find((team) =>
      team.players
        .flatMap((p) => p.steam64Id)
        .some((steamId) => steamId === playerSteam64Id)
    );

    const enemyTeam = demo.teams.find((team) => team !== friendlyTeam);

    if (!friendlyTeam || !enemyTeam) {
      functions.logger.error("Couldn't find teams in demo", {
        id: demo.id,
        friendlyTeam,
        enemyTeam,
      });

      return null;
    }

    const playerScore = friendlyTeam.players.find(
      (player) => player.steam64Id === playerSteam64Id
    )?.playerScore;
    if (!playerScore) {
      functions.logger.error("Couldn't find player's score", {
        id: demo.id,
        playerSteam64Id,
        friendlyTeam,
      });

      return null;
    }

    const { kills, assists, deaths } = playerScore;

    return {
      id: demo.id,
      matchTimestamp: DateTime.fromISO(demo.officialMatchTimestamp ?? ""),
      matchType: MatchType.Valve,
      rank: "--",
      mapName: demo.mapName,
      teamScore: friendlyTeam.score.total,
      enemyTeamScore: enemyTeam.score.total,
      kills,
      assists,
      flashAssists: 0,
      deaths,
      headshotPercentage: "--",
    };
  }

  return (
    await parsedDemosCollection()
      .where("playersSteam64Ids", "array-contains", playerSteam64Id)
      .orderBy("officialMatchTimestamp", "desc")
      .get()
  ).docs
    .map((doc) => doc.data())
    .map(convertParsedDemoToPlayerMatch)
    .filter(notNullish);
};
