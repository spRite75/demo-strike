import { DateTime } from "luxon";
import { playerListCollection } from "../../../models/firestore";
import { QueryResolvers } from "../../generated/graphql";

export const player: QueryResolvers["player"] = async (
  _,
  { params: { steam64Id } },
  ___
) => {
  const data = (await playerListCollection().doc(steam64Id).get()).data();
  if (!data) return null;
  return {
    id: data.steam64Id,
    steam64Id: data.steam64Id,
    demoCount: data.demoCount,
    displayName: data.displayName,
    lastPlayedTimestamp: DateTime.fromISO(data.lastPlayedTimestamp),
    profileUrl: data.profileUrl,
    avatarUrl: data.avatarUrl,
  };
};
