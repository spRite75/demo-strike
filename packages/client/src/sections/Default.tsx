import { useIsAuthed } from "../hooks/useIsAuthed";
import { useProfile } from "../hooks/useProfile";

export function Default() {
  const isAuthed = useIsAuthed();
  const { loading, data } = useProfile();
  const displayName = data?.displayName;
  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Welcome to Demo Strike</h1>
          <p className="py-6">{loading && "Loading data..."}</p>
          {isAuthed && <span>Welcome {displayName || "<unknown>"}</span>}
        </div>
      </div>
    </div>
  );
}
