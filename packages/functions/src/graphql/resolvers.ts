import { Resolvers } from "./generated/graphql";
import { profilesCollection } from "../models/firestore";
import { dateTimeScalar } from "./scalars";
import { myMatches } from "./resolvers/query/myMatches";
import { createProfile } from "./resolvers/mutation/createProfile";
import { uploadDemos } from "./resolvers/mutation/uploadDemos";
import { myProfile } from "./resolvers/query/myProfile";
import { players } from "./resolvers/query/players";
import { player } from "./resolvers/query/player";
import { matches } from "./resolvers/query/matches";

export const resolvers: Resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    hello: async (_, __, { uid }) => {
      const profile =
        !!uid &&
        (await profilesCollection()
          .doc(uid)
          .get()
          .then((doc) => doc.data()));
      const person = profile ? profile.displayName : "stranger";
      return `Hello ${person}!`;
    },
    players,
    myProfile,
    myMatches,
    player,
    matches,
  },
  Mutation: {
    createProfile,
    uploadDemos,
  },
};
