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
  hasInfoFile: boolean;
  uploaderUid: string;
}>("demo-uploads", ({ json }) => {
  if (
    typeof json === "object" &&
    typeof json.filePath === "string" &&
    typeof json.lastModified === "string" &&
    typeof json.hasInfoFile === "boolean" &&
    typeof json.uploaderUid === "string"
  )
    return json;
  functions.logger.error("Invalid DemoUploadMessage", json);
  throw new Error("Invalid DemoUploadMessage");
});

export const demoParseFailurePubsub = pubsubGenerator<{
  fileName: string;
  failedTime: number;
}>("demo-parse-failure", ({ json }) => {
  if (
    typeof json === "object" &&
    typeof json.fileName === "string" &&
    typeof json.failedTime === "number"
  )
    return json;
  functions.logger.error("Invalid ParseDemoFailureMessage", json);
  throw new Error("Invalid ParseDemoFailureMessage");
});
