import { Resolvers } from "./generated/graphql";
import { Profile, profileCollection } from "./models/profile";
import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";
import { authUser } from "../authUser";

export const resolvers: Resolvers = {
  Query: {
    hello: async (_, __, { uid }) => {
      const profile =
        !!uid &&
        (await profileCollection()
          .doc(uid)
          .get()
          .then((doc) => doc.data()));
      const person = profile ? profile.displayName : "stranger";
      return `Hello ${person}!`;
    },
    profile: async (_, __, { uid }) => {
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
    uploadDemos: async (_, { input: { demos } }, { uid, roles }) => {
      if (!uid) throw new Error("User is not signed in!");
      if (!roles || !roles.some((role) => role === "user"))
        throw new Error("User is missing 'user' role!");

      const pubsub = new PubSub();
      const topic = pubsub.topic("demo-uploads");

      await Promise.all(
        demos.map(async (demo) => {
          await topic.publishMessage({ json: demo });
        })
      );

      return 200;
    },
  },
};
