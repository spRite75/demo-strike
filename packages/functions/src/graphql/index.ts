import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ApolloServer } from "apollo-server-cloud-functions";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { join } from "path";
import { resolvers } from "./resolvers";
import { ContextFunction } from "apollo-server-core";
import { Profile, profileCollection } from "./models/profile";

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

export interface Context {
  uid: string | undefined;
  profile: Profile | undefined;
}

const typeDefs = loadSchemaSync(join(__dirname, "schema.graphql"), {
  loaders: [new GraphQLFileLoader()],
});

const authenticate = async (idToken: string) => {
  if (idToken.length === 0) return undefined; // User is not trying to authenticate this request
  return await admin.auth().verifyIdToken(idToken);
};

const context: ContextFunction<any, Context> = async ({ req }) => {
  const idToken = req.headers.authorization || "";
  const decodedJwt = await authenticate(idToken);
  const uid = decodedJwt?.uid;
  const profileDocument = uid
    ? await profileCollection().doc(uid).get()
    : undefined;
  const profile = profileDocument?.data();
  return { uid, profile };
};

const server = new ApolloServer({ typeDefs, resolvers, context });

const apolloHandler = server.createHandler();

export const handler = functions.https.onRequest(apolloHandler as any);
