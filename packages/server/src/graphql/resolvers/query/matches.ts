import { QueryResolvers } from "../../generated/graphql";

export const matches: QueryResolvers["matches"] = async (_, __, { prisma }) => {
  const data = await prisma.client.match.findMany({
    orderBy: { mapName: "asc" },
    include: { players: true },
  });

  return data;
};
