import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { setContext } from "@apollo/client/link/context";
import { sha256 } from "crypto-hash";

export function getApolloClient() {
  const authLink = setContext(async (_, { headers }) => {
    const authorization = "some-id-token";

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
    uri: "/api/graphql",
    useGETForQueries: true,
  });

  return new ApolloClient({
    link: authLink.concat(persistedQueryLink).concat(httpLink),
    cache: new InMemoryCache(),
  });
}
