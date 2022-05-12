import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { parseDemo } from "./parseDemo";
import { parsedDemosCollection } from "../models/firestore";
import { demoParseFailurePubsub, demoUploadsPubsub } from "../models/pubsub";
import { PubSub } from "@google-cloud/pubsub";

async function load(filePath: string) {
  const [file] = await admin.storage().bucket().file(filePath).download();
  return file;
}

export const handler = functions.pubsub
  .topic(demoUploadsPubsub.topicName)
  .onPublish(async (pubsubMessage) => {
    const { filePath, uploaderUid } = demoUploadsPubsub.read(pubsubMessage);
    functions.logger.log("received a demo", pubsubMessage.json);
    const file = await load(filePath);
    const fileName = filePath.split("/").pop() || "";

    try {
      const parsedDemo = await parseDemo({
        fileName,
        uploaderUid,
        demoBuffer: file,
      });
      await parsedDemosCollection().doc(parsedDemo.id).set(parsedDemo);
    } catch (error) {
      const pubsub = new PubSub();
      const topic = pubsub.topic(demoParseFailurePubsub.topicName);

      topic.publishMessage(
        demoParseFailurePubsub.create({ fileName, failedTime: Date.now() })
      );

      functions.logger.error("Failed to process demo", {
        error,
        filePath,
        uploaderUid,
      });
    }

    await admin.storage().bucket().file(filePath).delete();
  });
