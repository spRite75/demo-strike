import * as functions from "firebase-functions";
import * as Busboy from "busboy";
import { Readable } from "stream";

export const handler = functions.https.onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).end();
    return;
  }

  const processedRequest = await processRequest(request);
  console.log(processedRequest.fields);
  response.send("hi");
});

interface ProcessedRequest {
  fields: { [name: string]: any };
  uploads: { [fieldName: string]: { [fileName: string]: Readable } };
}

function processRequest(
  request: functions.https.Request
): Promise<ProcessedRequest> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: request.headers });

    const fields: ProcessedRequest["fields"] = {};
    const uploads: ProcessedRequest["uploads"] = {};

    busboy.on("field", (fieldName, fieldValue) => {
      console.log('found field', fieldName, fieldValue);
      fields[fieldName] = fieldValue;
    });

    busboy.on("file", (fieldName, data, { filename }) => {
      console.log("found file", fieldName, filename);
      if (!uploads[fieldName]) uploads[fieldName] = {};
      uploads[fieldName][filename] = data;
    });

    busboy.on("finish", () => {
      resolve({ fields, uploads });
    });
  });
}
