import { Switch, Route } from "wouter";
import { Default } from "./sections/Default";
import { Header } from "./sections/Header";
import { MatchesPage } from "./sections/MatchesPage";

function App() {
  return (
    <>
      <Header />
      <Switch>
        <Route path="/matches" component={MatchesPage} />
        <Route component={Default} />
      </Switch>
    </>
  );
}

export default App;
