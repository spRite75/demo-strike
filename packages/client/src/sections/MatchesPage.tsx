import { DateTime } from "luxon";
import { useGetMyMatchesQuery, GetMyMatchesQuery } from "../generated/graphql";

// TODO: remove after adding steamid setting to profile
const spRiteSteam64Id = "76561197993154537";

const myTeam = (match: GetMyMatchesQuery["myMatches"][0]) => {
  if (
    match.counterTerroristScore.playerScores.some(
      (p) => p.steam64Id === spRiteSteam64Id
    )
  ) {
    return "counterTerroristScore" as const;
  }
  if (
    match.terroristScore.playerScores.some(
      (p) => p.steam64Id === spRiteSteam64Id
    )
  ) {
    return "terroristScore" as const;
  }
};

const enemyTeam = (match: GetMyMatchesQuery["myMatches"][0]) => {
  if (
    match.counterTerroristScore.playerScores.some(
      (p) => p.steam64Id === spRiteSteam64Id
    )
  ) {
    return "terroristScore" as const;
  }
  if (
    match.terroristScore.playerScores.some(
      (p) => p.steam64Id === spRiteSteam64Id
    )
  ) {
    return "counterTerroristScore" as const;
  }
};

const myStats = (match: GetMyMatchesQuery["myMatches"][0]) => {
  return [
    ...match.counterTerroristScore.playerScores,
    ...match.terroristScore.playerScores,
  ].find((p) => p.steam64Id === spRiteSteam64Id);
};

export function MatchesPage() {
  const { data, loading, error } = useGetMyMatchesQuery();
  if (loading) return <span>Loading...</span>;
  if (error || !data)
    return (
      <span>
        Error occurred loading matches: {JSON.stringify(error, undefined, 2)}
      </span>
    );

  const sortedMatches = [...data.myMatches].sort(
    (a, b) =>
      new Date(b.matchTimeStamp).getTime() -
      new Date(a.matchTimeStamp).getTime()
  );

  return (
    <>
      <h1>Recent matches</h1>
      {sortedMatches.length > 0 && (
        <>
          <table>
            <thead>
              <th>Date</th>
              <th>Score</th>
              <th>Kills</th>
              <th>Assists</th>
              <th>Deaths</th>
            </thead>
            <tbody>
              {sortedMatches.map((match) => (
                <tr key={match.id}>
                  <td>
                    {DateTime.fromISO(match.matchTimeStamp)
                      .setZone("local")
                      .toFormat("dd LLL yyyy '@' HH:mm")}
                  </td>
                  <td>
                    {match[myTeam(match) ?? "counterTerroristScore"].total}:
                    {match[enemyTeam(match) ?? "terroristScore"].total}
                  </td>
                  <td>{myStats(match)?.kills ?? "--"}</td>
                  <td>{myStats(match)?.assists ?? "--"}</td>
                  <td>{myStats(match)?.deaths ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
