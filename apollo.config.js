module.exports = {
  client: {
    service: {
      localSchemaFile: "./packages/functions/src/graphql/schema.graphql",
    },
    includes: ["./packages/client/**/*.graphql"],
  },
};
