import { DateTime } from "luxon";
import { orderBy } from "src/utils";
import { Player, QueryResolvers } from "../../generated/graphql";

export const players: QueryResolvers["players"] = async (_, __, { prisma }) => {
  const dbPlayers = await prisma.client.player.findMany({
    include: {
      _count: { select: { matchPlayers: true } },
      matchPlayers: {
        select: {
          Match: { include: { demoFile: { select: { fileUpdated: true } } } },
        },
        orderBy: { Match: { demoFile: { fileCreated: "desc" } } },
        take: 1,
      },
    },
  });

  return dbPlayers
    .map((dbPlayer): Player => {
      const {
        matchPlayers,
        _count: { matchPlayers: demoCount },
      } = dbPlayer;
      const lastPlayedTimestamp = DateTime.fromJSDate(
        matchPlayers[0]?.Match.demoFile.fileUpdated ?? new Date(0)
      );

      return {
        ...dbPlayer,
        id: `${dbPlayer.id}`,
        demoCount,
        lastPlayedTimestamp,
      };
    })
    .sort(orderBy("demoCount", "desc"));
};
