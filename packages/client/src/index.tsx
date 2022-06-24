import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { getApolloClient } from "./apollo";
import { BrowserRouter } from "react-router-dom";

(async () => {
  const apolloClient = getApolloClient();

  const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );
  root.render(
    <React.StrictMode>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApolloProvider>
    </React.StrictMode>
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
})();
