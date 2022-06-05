import { PubSub } from "@google-cloud/pubsub";
import { demoUploadsPubsub } from "../../../models/pubsub";
import { MutationResolvers } from "../../generated/graphql";

export const uploadDemos: MutationResolvers["uploadDemos"] = async (
  _,
  { input: { demos } },
  { uid, roles }
) => {
  if (!uid) throw new Error("User is not signed in!");
  if (!roles || !roles.some((role) => role === "user"))
    throw new Error("User is missing 'user' role!");

  const pubsub = new PubSub();
  const topic = pubsub.topic(demoUploadsPubsub.topicName);

  const demFiles = demos.filter((demo) => demo.fileName.endsWith(".dem"));
  const infoFiles = demos.filter((demo) => demo.fileName.endsWith(".dem.info"));

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
};
