import { useEffect } from "react";
import { useGetProfileLazyQuery } from "../generated/graphql";
import { useIsAuthed } from "./useIsAuthed";

/** 
 * Fetches the user profile only if the user is authed.
 * `loading` will never change to false if called for an unauthenticated user.
 * */
export function useProfile() {
  const isAuthed = useIsAuthed();
  const [doQuery, { loading, data, error, called }] = useGetProfileLazyQuery();
  if (error) console.error(error);

  useEffect(() => {
    if (isAuthed) doQuery();
  }, [isAuthed]);

  return {loading: called ? loading : true, data: data?.profile };
}
