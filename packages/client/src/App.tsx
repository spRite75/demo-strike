import React, { useEffect } from "react";

import { useIsAuthed } from "./hooks/useIsAuthed";
import { useProfile } from "./hooks/useProfile";
import { Header } from "./sections/Header";

function App() {
  const isAuthed = useIsAuthed();
  const { loading, data } = useProfile();

  const displayName = data?.displayName;

  return (
    <>
      <Header />
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Welcome to Demo Strike</h1>
            <p className="py-6">{loading && "Loading data..."}</p>
            {isAuthed && <span>Welcome {displayName || "<unknown>"}</span>}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
