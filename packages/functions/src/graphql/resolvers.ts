import { Resolvers } from "./generated/graphql";
import { Profile, profileCollection } from "./models/profile";
import * as functions from "firebase-functions";
import { authUser } from "../authUser";

export const resolvers: Resolvers = {
  Query: {
    hello: async (a, b, { uid }) => {
      const profile =
        !!uid &&
        (await profileCollection()
          .doc(uid)
          .get()
          .then((doc) => doc.data()));
      const person = profile ? profile.displayName : "stranger";
      return `Hello ${person}!`;
    },
    profile: async (a, b, { uid }) => {
      if (!uid) return null;
      const profile = await profileCollection()
        .doc(uid)
        .get()
        .then((doc) => doc.data());
      return profile || null;
    },
  },
  Mutation: {
    createProfile: async (_, { input: { displayName } }, { uid }) => {
      if (!uid) throw new Error("User is not signed in!");
      if (!displayName) throw new Error("Display name is required");

      const profile = new Profile({ id: uid, displayName });
      const writeResult = await profileCollection()
        .doc(profile.id)
        .set(profile);

      const user = authUser.uid(uid);
      await Promise.all([user.flags.hasProfile.set(), user.roles.add("user")]);

      functions.logger.log(
        `Created profile for ${displayName} (uid: ${uid}) at ${writeResult.writeTime
          .toDate()
          .toISOString()}`
      );
      return profile;
    },
  },
};
