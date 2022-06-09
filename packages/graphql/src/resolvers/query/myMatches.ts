import { ForbiddenError } from "apollo-server-cloud-functions";
import { QueryResolvers } from "../../generated/graphql";
import {
  profilesCollection,
  parsedDemosCollection,
} from "../../../models/firestore";
import { convertParsedDemoToMatch } from "./shared/convertParsedDemoToMatch";
import { notNullish } from "../../../utils";

export const myMatches: QueryResolvers["myMatches"] = async (
  _,
  __,
  { uid }
) => {
  if (!uid) throw new ForbiddenError("No user logged in!");
  const usersDemos = await profilesCollection()
    .doc(uid)
    .get()
    .then((document) => document.data())
    .then((data) => data && data.parsedDemos);
  if (!usersDemos) return [];

  const demos = await Promise.all(
    usersDemos.map((demoId) =>
      parsedDemosCollection()
        .doc(demoId)
        .get()
        .then((doc) => doc.data())
    )
  );

  return demos.map(convertParsedDemoToMatch).filter(notNullish);
};
