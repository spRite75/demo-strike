import { DateTime } from "luxon";
import { useGetMyMatchesQuery, GetMyMatchesQuery } from "../generated/graphql";
import { useProfile } from "../hooks/useProfile";
import { renderTimestamp } from "../utils";

const myTeam = (
  match: GetMyMatchesQuery["myMatches"][0],
  steam64Id: string
) => {
  if (
    match.counterTerroristScore.playerScores.some(
      (p) => p.steam64Id === steam64Id
    )
  ) {
    return "counterTerroristScore" as const;
  }
  if (
    match.terroristScore.playerScores.some((p) => p.steam64Id === steam64Id)
  ) {
    return "terroristScore" as const;
  }
};

const enemyTeam = (
  match: GetMyMatchesQuery["myMatches"][0],
  steam64Id: string
) => {
  if (
    match.counterTerroristScore.playerScores.some(
      (p) => p.steam64Id === steam64Id
    )
  ) {
    return "terroristScore" as const;
  }
  if (
    match.terroristScore.playerScores.some((p) => p.steam64Id === steam64Id)
  ) {
    return "counterTerroristScore" as const;
  }
};

const myStats = (
  match: GetMyMatchesQuery["myMatches"][0],
  steam64Id: string
) => {
  return [
    ...match.counterTerroristScore.playerScores,
    ...match.terroristScore.playerScores,
  ].find((p) => p.steam64Id === steam64Id);
};

export function MatchesPage() {
  const { data: profileData } = useProfile();
  const { data: matchesData, loading, error } = useGetMyMatchesQuery();
  if (loading) return <span>Loading...</span>;
  if (error || !matchesData)
    return (
      <span>
        Error occurred loading matches: {JSON.stringify(error, undefined, 2)}
      </span>
    );

  const sortedMatches = [...matchesData.myMatches].sort(
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
                  <td>{renderTimestamp(match.matchTimeStamp, "full")}</td>
                  <td>
                    {
                      match[
                        myTeam(match, `${profileData?.steam64Id}`) ??
                          "counterTerroristScore"
                      ].total
                    }
                    :
                    {
                      match[
                        enemyTeam(match, `${profileData?.steam64Id}`) ??
                          "terroristScore"
                      ].total
                    }
                  </td>
                  <td>
                    {myStats(match, `${profileData?.steam64Id}`)?.kills ?? "--"}
                  </td>
                  <td>
                    {myStats(match, `${profileData?.steam64Id}`)?.assists ??
                      "--"}
                  </td>
                  <td>
                    {myStats(match, `${profileData?.steam64Id}`)?.deaths ??
                      "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
