import { DateTime } from "luxon";
import { playerListCollection } from "../../../models/firestore";
import { QueryResolvers } from "../../generated/graphql";

export const players: QueryResolvers["players"] = async (_, __, ___) => {
  return (await playerListCollection().orderBy("demoCount", "desc").get()).docs
    .map((d) => d.data())
    .map(
      ({
        steam64Id,
        displayName,
        demoCount,
        lastPlayedTimestamp,
        avatarUrl,
        profileUrl,
      }) => ({
        id: steam64Id,
        steam64Id,
        displayName,
        demoCount,
        lastPlayedTimestamp: DateTime.fromISO(lastPlayedTimestamp),
        avatarUrl,
        profileUrl,
      })
    );
};
