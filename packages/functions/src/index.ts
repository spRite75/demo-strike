import { handler as graphql } from "./graphql";
import * as functions from "firebase-functions";

const pubsubhelloworld = functions.pubsub
  .topic("demo-uploads")
  .onPublish((message, context) => {
    functions.logger.log("received a demo", message.json);
  });

module.exports = {
  graphql,
  pubsubhelloworld,
};
