import * as functions from "firebase-functions";

interface PubsubThing<T> {
  topicName: string;
  read: (message: functions.pubsub.Message) => T;
  create: (value: T) => { json: any };
}

function pubsubGenerator<T>(
  topicName: string,
  read: (message: functions.pubsub.Message) => T
): PubsubThing<T> {
  return {
    topicName,
    read,
    create: (value: T) => ({ json: value }),
  };
}

export const demoUploadsPubsub = pubsubGenerator<{
  filePath: string;
  lastModified: string;
  uploaderUid: string;
}>("demo-uploads", ({ json }) => {
  if (
    typeof json === "object" &&
    typeof json.filePath === "string" &&
    typeof json.lastModified === "string"
  )
    return json;
  functions.logger.error("Invalid DemoUploadMessage", json);
  throw new Error("Invalid DemoUploadMessage");
});
