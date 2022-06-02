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
    const { filePath, hasInfoFile, uploaderUid } =
      demoUploadsPubsub.read(pubsubMessage);
    functions.logger.log("received a demo", pubsubMessage.json);

    const fileName = filePath.split("/").pop() || "";

    try {
      if (fileName.endsWith(".dem")) {
        const demoInfoPromise = hasInfoFile
          ? load(`${filePath}.info`).then(parseInfo)
          : undefined;
        const parsedDemoPromise = load(filePath).then(parseDemo);

        const [demoInfo, parsedDemo] = await Promise.all([
          demoInfoPromise,
          parsedDemoPromise,
        ]);

        if (demoInfo) {
          const { officialMatchId, officialMatchTimestamp, steam64Ids } =
            demoInfo;
          const { playersSteam64Ids } = parsedDemo;
          if (
            steam64Ids.sort().join(",") === playersSteam64Ids.sort().join(",")
          ) {
            // We have an official CSGO Matchmaking demo on our hands
            if (
              (
                await parsedDemosCollection()
                  .doc(demoInfo.officialMatchId)
                  .get()
              ).exists
            ) {
              functions.logger.info(
                `Demo ${fileName} is an official Matchmaking demo and has already been processed`
              );
            } else {
              const id = `mm-${officialMatchId}`;
              await parsedDemosCollection()
                .doc(id)
                .set({ id, officialMatchTimestamp, ...parsedDemo });
              await profilesCollection()
                .doc(uploaderUid)
                .update({
                  parsedDemos: FieldValue.arrayUnion(id),
                });
            }
          } else {
            functions.logger.error(".dem and .dem.info file mismatch");
          }
        }
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
