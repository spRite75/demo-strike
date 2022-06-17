import { Resolvers } from "../generated/graphql";
import { dateTimeScalar } from "../scalars";

import { matches } from "./query/matches";
import { players } from "./query/players";

export const resolvers: Resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    hello: async (_, __, { server }) => {
      return `Hello stranger! You're using ${server}`;
    },
    matches,
    players,
  },
  Mutation: {},
};
