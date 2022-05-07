import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  concat,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { Firebase } from "./firebase";

export function getApolloClient(firebase: Firebase) {
  const httpLink = createHttpLink({
    uri: "/graphql",
  });

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

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}
