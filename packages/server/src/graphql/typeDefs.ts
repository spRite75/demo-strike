import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { join } from "path";

export const typeDefs = loadSchemaSync(
  join(__dirname, "../../schema.graphql"),
  {
    loaders: [new GraphQLFileLoader()],
  }
);
