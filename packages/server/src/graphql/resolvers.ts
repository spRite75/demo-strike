import { MatchType, Player, PlayerMatch, Resolvers } from "./generated/graphql";
import { dateTimeScalar } from "./scalars";

import { DateTime } from "luxon";
import { GqlMapper, orderBy } from "src/utils";

export const resolvers: Resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    hello: async (_, __, { server }) => {
      return `Hello stranger! You're using ${server}`;
    },
    players: async (_, __, { prisma }) => {
      const dbPlayers = await prisma.client.player.findMany({
        include: {
          _count: { select: { matches: true } },
          matches: {
            select: {
              Match: {
                include: { demoFile: { select: { fileUpdated: true } } },
              },
            },
            orderBy: { Match: { demoFile: { fileCreated: "desc" } } },
            take: 1,
          },
        },
      });

      return dbPlayers
        .map((dbPlayer): GqlMapper<Player> => {
          const {
            steam64Id,
            displayName,
            steamProfileUrl,
            steamAvatarUrlDefault,
            steamAvatarUrlMedium,
            steamAvatarUrlFull,
            matches,
            _count: { matches: demoCount },
          } = dbPlayer;
          const lastPlayedTimestamp = DateTime.fromJSDate(
            matches[0]?.Match.demoFile.fileUpdated ?? new Date(0)
          );

          return {
            id: `${dbPlayer.id}`,
            steam64Id,
            displayName,
            demoCount,
            lastPlayedTimestamp,
            steamProfileUrl,
            steamAvatarUrlDefault,
            steamAvatarUrlMedium,
            steamAvatarUrlFull,
          };
        })
        .sort(orderBy("demoCount", "desc"));
    },
  },
  Player: {
    matches: async (parentPlayer, __, { prisma }) => {
      const dbMatchPlayers = await prisma.client.matchPlayer.findMany({
        include: {
          Match: { include: { demoFile: true, MatchTeam: true } },
          MatchTeam: true,
        },
        where: { playerId: parseInt(parentPlayer.id) },
      });

      return dbMatchPlayers.map((matchPlayer): GqlMapper<PlayerMatch> => {
        const playerTeam = matchPlayer.MatchTeam.team;
        const teamScore = matchPlayer.Match.MatchTeam.find(
          ({ team }) => team === playerTeam
        )?.scoreTotal;
        const enemyTeamScore = matchPlayer.Match.MatchTeam.find(
          ({ team }) => team !== playerTeam
        )?.scoreTotal;

        if (
          typeof teamScore === "undefined" ||
          typeof enemyTeamScore === "undefined"
        ) {
          throw new Error(
            `Could not identify team and enemy team scores for MatchPlayer ${matchPlayer.id}`
          );
        }

        return {
          id: matchPlayer.id,
          matchTimestamp: DateTime.fromJSDate(
            matchPlayer.Match.demoFile.fileUpdated
          ),
          matchType: MatchType.Valve,
          mapName: matchPlayer.Match.mapName,
          teamScore,
          enemyTeamScore,
          kills: matchPlayer.kills,
          assists: matchPlayer.assists,
          deaths: matchPlayer.deaths,
          headshotPercentage: matchPlayer.headshotPercentage,
        };
      });
    },
  },
  PlayerMatch: {},
  Mutation: {},
};
