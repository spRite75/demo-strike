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
    player: async (_, params, { prisma }) => {
      const dbPlayer = await prisma.client.player.findUnique({
        where: { steam64Id: params.steam64Id },
        include: {
          _count: { select: { MatchPlayers: true } },
          MatchPlayers: {
            select: {
              Match: {
                include: { DemoFile: { select: { fileUpdated: true } } },
              },
            },
            orderBy: { Match: { DemoFile: { fileCreated: "desc" } } },
            take: 1,
          },
        },
      });

      if (!dbPlayer) return null;

      const {
        steam64Id,
        displayName,
        steamProfileUrl,
        steamAvatarUrlDefault,
        steamAvatarUrlMedium,
        steamAvatarUrlFull,
        MatchPlayers,
        _count: { MatchPlayers: demoCount },
      } = dbPlayer;
      const lastPlayedTimestamp = DateTime.fromJSDate(
        MatchPlayers[0]?.Match.DemoFile.fileUpdated ?? new Date(0)
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
    },
    players: async (_, __, { prisma }) => {
      const dbPlayers = await prisma.client.player.findMany({
        include: {
          _count: { select: { MatchPlayers: true } },
          MatchPlayers: {
            select: {
              Match: {
                include: { DemoFile: { select: { fileUpdated: true } } },
              },
            },
            orderBy: { Match: { DemoFile: { fileCreated: "desc" } } },
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
            MatchPlayers,
            _count: { MatchPlayers: demoCount },
          } = dbPlayer;
          const lastPlayedTimestamp = DateTime.fromJSDate(
            MatchPlayers[0]?.Match.DemoFile.fileUpdated ?? new Date(0)
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
          Match: { include: { DemoFile: true, MatchTeams: true } },
          MatchTeam: true,
        },
        where: { playerId: parseInt(parentPlayer.id) },
      });

      return dbMatchPlayers
        .map((matchPlayer): GqlMapper<PlayerMatch> => {
          const playerTeam = matchPlayer.MatchTeam.team;
          const teamScore = matchPlayer.Match.MatchTeams.find(
            ({ team }) => team === playerTeam
          )?.scoreTotal;
          const enemyTeamScore = matchPlayer.Match.MatchTeams.find(
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

          const headshotPercentage = `${
            matchPlayer.headshotPercentage === null
              ? "--"
              : matchPlayer.headshotPercentage.toFixed(2)
          }%`;

          return {
            id: matchPlayer.id,
            matchTimestamp: DateTime.fromJSDate(
              matchPlayer.Match.DemoFile.fileUpdated
            ),
            matchType: MatchType.Valve,
            mapName: matchPlayer.Match.mapName,
            teamScore,
            enemyTeamScore,
            kills: matchPlayer.kills,
            assists: matchPlayer.assists,
            deaths: matchPlayer.deaths,
            headshotPercentage,
          };
        })
        .sort(orderBy("matchTimestamp", "desc"));
    },
  },
  PlayerMatch: {},
  Mutation: {},
};
