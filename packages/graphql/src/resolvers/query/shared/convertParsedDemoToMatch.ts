import { DateTime } from "luxon";
import { ParsedDemoDocument } from "../../../../models/firestore";
import { Match } from "../../../generated/graphql";

export function convertParsedDemoToMatch(
  demo: ParsedDemoDocument | undefined
): Match | undefined {
  if (!demo) return;
  const ctTeam = demo.teams.find((t) => t.finalTeamLetter === "CT");
  const tTeam = demo.teams.find((t) => t.finalTeamLetter === "T");
  if (!ctTeam || !tTeam) return;
  return {
    id: demo.id,
    matchTimeStamp: DateTime.fromISO(demo.officialMatchTimestamp ?? ""),
    mapName: demo.mapName,
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
  };
}
