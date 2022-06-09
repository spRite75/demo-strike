import { profilesCollection } from "../../../models/firestore";
import { QueryResolvers } from "../../generated/graphql";

export const myProfile: QueryResolvers["myProfile"] = async (
  _,
  __,
  { uid }
) => {
  if (!uid) throw new Error("User is not signed in!");
  const profile = await profilesCollection()
    .doc(uid)
    .get()
    .then((doc) => doc.data());
  return profile || null;
};
