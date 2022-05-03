import * as functions from "firebase-functions";
import { ApolloServer } from "apollo-server-cloud-functions";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { join } from "path";
import { resolvers } from "./resolvers";

const typeDefs = loadSchemaSync(join(__dirname, "schema.graphql"), {
  loaders: [new GraphQLFileLoader()],
});

const server = new ApolloServer({ typeDefs, resolvers });

const apolloHandler = server.createHandler();

export const handler = functions.https.onRequest(apolloHandler as any);
