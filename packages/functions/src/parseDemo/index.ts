import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { parseDemo } from "./parseDemo";
import {
  parsedDemosCollection,
  playerListCollection,
  profilesCollection,
} from "../models/firestore";
import { demoParseFailurePubsub, demoUploadsPubsub } from "../models/pubsub";
import { PubSub } from "@google-cloud/pubsub";
import { FieldValue } from "firebase-admin/firestore";
import { parseInfo } from "./parseInfo";
import { getPlayerSummaries } from "../steamWebApi";
import { DateTime } from "luxon";

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

        functions.logger.info("finished parsing");

        if (demoInfo) {
          const { officialMatchId, officialMatchTimestamp, steam64Ids } =
            demoInfo;
          const { playersSteam64Ids } = parsedDemo;
          if (
            steam64Ids.sort().join(",") === playersSteam64Ids.sort().join(",")
          ) {
            // We have an official CSGO Matchmaking demo on our hands
            const id = `mm-${officialMatchId}`;
            functions.logger.info(`demo id: ${id}`);

            // Save demo data
            const parsedDemoRef = parsedDemosCollection().doc(id);
            const hasDemoBeenParsedBefore = (await parsedDemoRef.get()).exists;
            await parsedDemoRef.set({
              id,
              officialMatchTimestamp,
              ...parsedDemo,
            });
            functions.logger.info(`demo data saved`);

            // Save uploaded demo to user's profile (in case they do not appear in the demo)
            await profilesCollection()
              .doc(uploaderUid)
              .update({
                parsedDemos: FieldValue.arrayUnion(id),
              });
            functions.logger.info(`uploader profile updated`);

            // Contribute to player list
            const allPlayers = parsedDemo.teams.flatMap((team) => team.players);
            const playerSummaries = await getPlayerSummaries(
              allPlayers.map((player) => player.steam64Id)
            );
            functions.logger.info(`got player summaries from steam`);

            Promise.all(
              allPlayers.map(async (player) => {
                const ref = playerListCollection().doc(player.steam64Id);
                const snap = await ref.get();
                if (snap.exists) {
                  await ref.update({
                    displayName: player.displayName,
                    demoCount: FieldValue.increment(
                      hasDemoBeenParsedBefore ? 0 : 1
                    ),
                    lastPlayedTimestamp: demoInfo.officialMatchTimestamp,
                  });
                } else {
                  const playerSummary = playerSummaries.get(player.steam64Id);

                  const currentLastPlayedDateTime = DateTime.fromISO(
                    snap.data()?.lastPlayedTimestamp ??
                      "1970-01-01T00:00:00.000Z"
                  );
                  const officialMatchDateTime = DateTime.fromISO(
                    demoInfo.officialMatchTimestamp
                  );

                  await ref.set({
                    steam64Id: player.steam64Id,
                    displayName: player.displayName,
                    demoCount: 1,
                    lastPlayedTimestamp: (currentLastPlayedDateTime <
                    officialMatchDateTime
                      ? officialMatchDateTime
                      : currentLastPlayedDateTime
                    ).toISO(),
                    profileUrl: playerSummary && playerSummary.profileUrl,
                    avatarUrl: playerSummary && {
                      default: playerSummary.avatar,
                      medium: playerSummary.avatarMedium,
                      full: playerSummary.avatarFull,
                    },
                  });
                }
              })
            );
            functions.logger.info(`saved players to player list`);
          } else {
            functions.logger.error(".dem and .dem.info file mismatch");
          }
        } else {
          functions.logger.error(
            "missing demoInfo - currently only able to parse official Matchmaking demos with .dem.info files included"
          );
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
