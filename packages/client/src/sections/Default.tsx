import { Link } from "react-router-dom";
import { useGetPlayerListQuery } from "../generated/graphql";
import { renderTimestamp } from "../utils";

export function Default() {
  const { data, loading } = useGetPlayerListQuery();
  return (
    <div className="container mx-auto pt-5">
      <h1 className="text-2xl text-center my-1">Player List</h1>
      <table className="table mx-auto">
        <thead>
          <tr>
            <th>Player</th>
            <th>Demos</th>
            <th>Last Played</th>
          </tr>
        </thead>
        <tbody>
          {data &&
            data.players.map((player) => (
              <tr key={player.steam64Id}>
                <td>
                  <span>
                    <a
                      href={player.steamProfileUrl ?? "#"}
                      className="inline mr-4"
                    >
                      <img
                        className="inline h-16 w-16"
                        src={
                          player.steamAvatarUrlMedium ??
                          "https://steamuserimages-a.akamaihd.net/ugc/868480752636433334/1D2881C5C9B3AD28A1D8852903A8F9E1FF45C2C8/"
                        }
                        alt="Player avatar"
                      />
                    </a>
                    <Link to={`/players/${player.steam64Id}/`}>
                      {player.displayName}
                    </Link>
                  </span>
                </td>
                <td>{player.demoCount}</td>
                <td>
                  {renderTimestamp(player.lastPlayedTimestamp, "day+month")}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
