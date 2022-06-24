module.exports = {
  client: {
    service: {
      localSchemaFile: "./packages/server/schema.graphql",
    },
    includes: ["./packages/client/**/*.graphql"],
  },
};
