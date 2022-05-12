import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { parseDemo } from "./parser";
import { parsedDemosCollection } from "../models/firestore";
import { demoUploadsPubsub } from "../models/pubsub";

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
    const parsedDemo = await parseDemo({
      fileName: filePath.split("/").pop() || "",
      uploaderUid,
      demoBuffer: file,
    });
    await parsedDemosCollection().doc(parsedDemo.id).set(parsedDemo);
  });
