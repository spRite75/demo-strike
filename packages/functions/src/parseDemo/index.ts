import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ParsingService } from "./parser";
import { parsedDemoCollection } from "../models/firestore/ParsedDemo";
import { demoUploadsPubsub } from "../models/pubsub";

const parser = new ParsingService();

async function load(filePath: string) {
  const [file] = await admin.storage().bucket().file(filePath).download();

  return file;
}

export const handler = functions.pubsub
  .topic(demoUploadsPubsub.topicName)
  .onPublish(async (pubsubMessage) => {
    const { filePath, lastModified, uploaderUid } =
      demoUploadsPubsub.read(pubsubMessage);
    functions.logger.log("received a demo", pubsubMessage.json);
    const file = await load(filePath);
    const parsedDemo = await parser.parseDemo({
      fileName: filePath.split("/").pop() || "",
      uploaderUid,
      demoStream: file,
    });
    await parsedDemoCollection()
      .doc(parsedDemo.id || "")
      .set(parsedDemo);
  });
