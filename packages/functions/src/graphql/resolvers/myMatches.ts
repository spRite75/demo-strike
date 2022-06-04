import { ForbiddenError } from "apollo-server-cloud-functions";
import { QueryResolvers, Match } from "../generated/graphql";
import {
  profilesCollection,
  parsedDemosCollection,
} from "../../models/firestore";
import { DateTime } from "luxon";

export const myMatches: QueryResolvers["myMatches"] = async (
  _,
  __,
  { uid }
) => {
  if (!uid) throw new ForbiddenError("No user logged in!");
  const usersDemos = await profilesCollection()
    .doc(uid)
    .get()
    .then((document) => document.data())
    .then((data) => data && data.parsedDemos);
  if (!usersDemos) return [];

  const demos = await Promise.all(
    usersDemos.map((demoId) =>
      parsedDemosCollection()
        .doc(demoId)
        .get()
        .then((doc) => doc.data())
    )
  );

  const matches: Match[] = [];

  demos.forEach((demo) => {
    if (!demo) return;
    const ctTeam = demo.teams.find((t) => t.finalTeamLetter === "CT");
    const tTeam = demo.teams.find((t) => t.finalTeamLetter === "T");
    if (!ctTeam || !tTeam) return;
    matches.push({
      id: demo.id,
      matchTimeStamp: DateTime.fromISO(demo.officialMatchTimestamp ?? ""),
      counterTerroristScore: {
        firstHalf: ctTeam.score.firstHalf,
        secondHalf: ctTeam.score.secondHalf,
        total: ctTeam.score.total,
        playerScores: ctTeam.players.map(
          ({
            steam64Id,
            displayName,
            playerScore: { kills, assists, deaths },
          }) => ({ steam64Id, displayName, kills, assists, deaths })
        ),
      },
      terroristScore: {
        firstHalf: tTeam.score.firstHalf,
        secondHalf: tTeam.score.secondHalf,
        total: tTeam.score.total,
        playerScores: tTeam.players.map(
          ({
            steam64Id,
            displayName,
            playerScore: { kills, assists, deaths },
          }) => ({ steam64Id, displayName, kills, assists, deaths })
        ),
      },
    });
  });

  return matches;
};
