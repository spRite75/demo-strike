import { Resolvers } from "./generated/graphql";
import { ProfileDocument, profilesCollection } from "../models/firestore";
import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";
import { authUser } from "../authUser";
import { demoUploadsPubsub } from "../models/pubsub";
import { dateTimeScalar } from "./scalars";
import { myMatches } from "./resolvers/myMatches";

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
    profile: async (_, __, { uid }) => {
      if (!uid) throw new Error("User is not signed in!");
      const profile = await profilesCollection()
        .doc(uid)
        .get()
        .then((doc) => doc.data());
      return profile || null;
    },
    myMatches,
  },
  Mutation: {
    createProfile: async (_, { input: { displayName } }, { uid, flags }) => {
      if (!uid) throw new Error("User is not signed in!");
      if (!(flags && flags.needsProfile)) throw new Error("User not eligible!");

      const profile: ProfileDocument = {
        id: uid,
        displayName,
        parsedDemos: [],
      };
      const writeResult = await profilesCollection()
        .doc(profile.id)
        .set(profile);

      const user = authUser.uid(uid);
      await user.flags.hasProfile
        .set()
        .then(() => user.flags.needsProfile.unset())
        .then(() => user.roles.add("user"));

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
      const topic = pubsub.topic(demoUploadsPubsub.topicName);

      const demFiles = demos.filter((demo) => demo.fileName.endsWith(".dem"));
      const infoFiles = demos.filter((demo) =>
        demo.fileName.endsWith(".dem.info")
      );

      await Promise.all(
        demFiles.map(async (demo) => {
          await topic.publishMessage(
            demoUploadsPubsub.create({
              filePath: `demos/u/${uid}/o/${demo.fileName}`,
              lastModified: demo.lastModified.toISO(),
              hasInfoFile: infoFiles.some(
                (infoFile) => infoFile.fileName === `${demo.fileName}.info`
              ),
              uploaderUid: uid,
            })
          );
        })
      );

      return 200;
    },
  },
};
