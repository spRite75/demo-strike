import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { parseDemo } from "./parseDemo";
import { parsedDemosCollection, profilesCollection } from "../models/firestore";
import { demoParseFailurePubsub, demoUploadsPubsub } from "../models/pubsub";
import { PubSub } from "@google-cloud/pubsub";
import { FieldValue } from "firebase-admin/firestore";
import { parseInfo } from "./parseInfo";

async function load(filePath: string) {
  const [file] = await admin.storage().bucket().file(filePath).download();
  return file;
}

export const handler = functions.pubsub
  .topic(demoUploadsPubsub.topicName)
  .onPublish(async (pubsubMessage) => {
    const { filePath, hasInfoFile, lastModified, uploaderUid } =
      demoUploadsPubsub.read(pubsubMessage);
    functions.logger.log("received a demo", pubsubMessage.json);

    const fileName = filePath.split("/").pop() || "";

    const file = await load(filePath);

    try {
      if (fileName.endsWith(".dem")) {
        const demoInfo =
          hasInfoFile && (await parseInfo(await load(`${filePath}.info`)));

        console.log(demoInfo); // TODO: use demoInfo in identifying demo start time and ID
        const parsedDemo = await parseDemo({
          fileName,
          uploaderUid,
          demoBuffer: file,
        });
        await parsedDemosCollection().doc(parsedDemo.id).set(parsedDemo);
        await profilesCollection()
          .doc(uploaderUid)
          .update({ parsedDemos: FieldValue.arrayUnion(parsedDemo.id) });
      }
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

    await Promise.all([
      admin.storage().bucket().file(filePath).delete(),
      hasInfoFile && admin.storage().bucket().file(`${filePath}.info`).delete(),
    ]);
  });
