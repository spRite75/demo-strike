import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ApolloServer } from "apollo-server-cloud-functions";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { join } from "path";

import { resolvers } from "./resolvers";
import { ContextFunction } from "apollo-server-core";
import { extractUserTokenData } from "../authUser";

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

export type Context = {} & Partial<ReturnType<typeof extractUserTokenData>>;

const typeDefs = loadSchemaSync(join(__dirname, "schema.graphql"), {
  loaders: [new GraphQLFileLoader()],
});

const context: ContextFunction<any, Context> = async ({ req }) => {
  let userTokenData: Partial<ReturnType<typeof extractUserTokenData>> = {};
  try {
    const decodedJwt = await admin
      .auth()
      .verifyIdToken(req.headers.authorization);
    userTokenData = extractUserTokenData(decodedJwt);
  } catch (e) {
    functions.logger.warn("idToken not decoded", e);
  }

  return { ...userTokenData };
};

const server = new ApolloServer({ typeDefs, resolvers, context });

const apolloHandler = server.createHandler();

export const handler = functions.https.onRequest(apolloHandler as any);
