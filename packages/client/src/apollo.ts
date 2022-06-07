import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { setContext } from "@apollo/client/link/context";
import { sha256 } from "crypto-hash";

import { Firebase } from "./firebase";

export function getApolloClient(firebase: Firebase) {
  const authLink = setContext(async (_, { headers }) => {
    const user = firebase.getAuth().currentUser;
    const authorization = user ? await user.getIdToken() : "";

    return {
      headers: {
        ...headers,
        authorization,
      },
    };
  });

  const persistedQueryLink = createPersistedQueryLink({
    sha256,
    useGETForHashedQueries: true,
  });

  const httpLink = createHttpLink({
    uri: "/graphql",
    useGETForQueries: true,
  });

  return new ApolloClient({
    link: authLink.concat(persistedQueryLink).concat(httpLink),
    cache: new InMemoryCache(),
  });
}
