import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  concat,
} from "@apollo/client";
import { getAuth } from "firebase/auth";

const httpLink = new HttpLink({ uri: "/graphql" });

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext(({ headers = {} }) => {
    const user = getAuth().currentUser;
    const authorization = user ? user.getIdToken() : null

    return {
      headers: {
        ...headers,
        authorization,
      },
    };
  });
  return forward(operation);
});

export const apolloClient = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache(),
  link: concat(authMiddleware, httpLink),
});
