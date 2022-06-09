import React from "react";
import {
  Link,
  Route,
  Routes,
  useMatch,
  useParams,
  useResolvedPath,
  Navigate,
} from "react-router-dom";
import { CalendarIcon } from "@heroicons/react/outline";
import {
  useGetPlayerMatchesQuery,
  useGetPlayerQuery,
} from "../generated/graphql";
import { DateTime } from "luxon";
import { renderTimestamp } from "../utils";

export function PlayerPage() {
  const { steam64Id } = useParams();
  if (!steam64Id) throw new Error("No player ID to load");
  const { data, loading } = useGetPlayerQuery({
    variables: { steam64Id },
  });

  if (loading || !data) {
    return <p>Loading...</p>;
  }

  const { player } = data;

  if (!player) return <p>Player not found...</p>;

  return (
    <div className="container mx-auto pt-5 text-center">
      <div className="mx-auto w-1/2">
        <img
          src={player.avatarUrl?.full}
          alt={`Avatar of ${player.displayName}`}
          className="rounded-xl inline-block"
        />
        <h2 className="text-xl">{player.displayName}</h2>
      </div>

      <div className="tabs tabs-boxed inline-flex mt-2">
        <LinkTab to="demos">Demos</LinkTab>
        <LinkTab to="banned">Banned Players</LinkTab>
        <LinkTab to="charts">Charts</LinkTab>
      </div>
      <Routes>
        <Route index element={<Navigate to="demos" />} />
        <Route path="demos" element={<Demos steam64Id={steam64Id} />} />
        <Route path="banned" element={<p>Banned players page</p>} />
        <Route path="charts" element={<p>Charts page</p>} />
      </Routes>
    </div>
  );
}

function LinkTab(props: React.ComponentProps<typeof Link>) {
  const resolved = useResolvedPath(props.to);
  const match = useMatch({ path: resolved.pathname, end: true });
  let className = "tab";
  if (match) className += " tab-active";
  return (
    <Link {...props} className={className}>
      {props.children}
    </Link>
  );
}

function Demos(props: { steam64Id: string }) {
  const { steam64Id } = props;
  const { data, loading } = useGetPlayerMatchesQuery({
    variables: { steam64Id },
  });

  if (loading || !data) {
    return <p>Loading...</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>
            <CalendarIcon />
          </th>
          <th>Type</th>
          <th>Rank</th>
          <th>Map</th>
          <th>Score</th>
          <th>K</th>
          <th>A</th>
          <th>D</th>
          <th>KDD</th>
          <th>HS%</th>
        </tr>
      </thead>
      <tbody>
        {data.matches.map((match) => (
          <tr key={match.id}>
            <td>{renderTimestamp(match.matchTimestamp, "full")}</td>
            <td></td> {/* TODO: get rest of fields */}
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
