import { parsedDemosCollection } from "../../../models/firestore";
import { notNullish } from "../../../utils";
import { QueryResolvers } from "../../generated/graphql";
import { convertParsedDemoToMatch } from "./shared/convertParsedDemoToMatch";

export const matches: QueryResolvers["matches"] = async (
  _,
  { params: { playerSteam64Id } },
  ___
) => {
  return (
    await parsedDemosCollection()
      .where("playersSteam64Ids", "array-contains", playerSteam64Id)
      .orderBy("officialMatchTimestamp", "desc")
      .get()
  ).docs
    .map((doc) => doc.data())
    .map(convertParsedDemoToMatch)
    .filter(notNullish);
};
