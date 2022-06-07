import { useGetPlayersQuery } from "../generated/graphql";
import { renderTimestamp } from "../utils";

export function Default() {
  const { data, loading } = useGetPlayersQuery();
  return (
    <div className="container mx-auto mt-5">
      <h1 className="text-2xl text-center">Player List</h1>
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
                    <a href={player.profileUrl ?? "#"} className="inline mr-4">
                      <img
                        className="inline h-16 w-16"
                        src={
                          player.avatarUrl?.medium ??
                          "https://steamuserimages-a.akamaihd.net/ugc/868480752636433334/1D2881C5C9B3AD28A1D8852903A8F9E1FF45C2C8/"
                        }
                        alt="Player avatar"
                      />
                    </a>
                    {player.displayName}
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
