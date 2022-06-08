import { Routes, Route } from "react-router-dom";
import { Default } from "./sections/Default";
import { Header } from "./sections/Header";
import { MatchesPage } from "./sections/MatchesPage";
import { PlayerPage } from "./sections/PlayerPage";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route index element={<Default />} />
        <Route path="players/:steam64Id/*" element={<PlayerPage />} />
        <Route path="matches" element={<MatchesPage />} />
      </Routes>
    </>
  );
}

export default App;
