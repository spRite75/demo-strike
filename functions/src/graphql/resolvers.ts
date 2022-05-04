import { Resolvers } from "./generated/graphql"
import { Context } from "."
import { Profile, profileCollection } from "./models/profile";
import * as functions from "firebase-functions"

export const resolvers: Resolvers<Context> = {
  Query: {
    hello: (a, b, { profile }) => {
      const person = profile ? profile.displayName : "stranger"
      return `Hello ${person}!`
    },
    profile: (a, b, { profile }) => {
      if (!profile) return null;
      return profile;
    }
  },
  Mutation: {
    createProfile: async (_, { displayName }, { uid }) => {
      if (!uid) throw new Error("User is not signed in!");
      if (!displayName) throw new Error("Display name is required");
      
      const profile = new Profile({ displayName })
      const writeResult = await profileCollection().doc(uid).set(profile);
      functions.logger.log(`Created profile for ${displayName} (uid: ${uid}) at ${writeResult.writeTime.toDate().toISOString()}`)
      return profile
    }
  }
};
