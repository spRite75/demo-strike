import { DateTime } from "luxon";
import React from "react";
import { useGetMyMatchesQuery } from "../generated/graphql";

export function MatchesPage() {
  const { data, loading, error } = useGetMyMatchesQuery();
  if (loading) return <span>Loading...</span>;
  if (error || !data)
    return (
      <span>
        Error occurred loading matches: {JSON.stringify(error, undefined, 2)}
      </span>
    );

  return (
    <>
      <h1>Recent matches</h1>
      {data.myMatches.length > 0 && (
        <>
          <table>
            <thead>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </thead>
            <tbody>
              {data.myMatches.map(
                ({ matchTimeStamp, counterTerroristScore, terroristScore }) => (
                  <tr>
                    <td>
                      {DateTime.fromISO(matchTimeStamp)
                        .setZone("local")
                        .toFormat("dd LLL yyyy '@' HH:mm")}
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
