import { authUser } from "../../../authUser";
import { ProfileDocument, profilesCollection } from "../../../models/firestore";
import { MutationResolvers } from "../../generated/graphql";
import * as functions from "firebase-functions";

export const createProfile: MutationResolvers["createProfile"] = async (
  _,
  { input: { displayName, steam64Id } },
  { uid, flags }
) => {
  if (!uid) throw new Error("User is not signed in!");
  if (!(flags && flags.needsProfile)) throw new Error("User not eligible!");

  const profile: ProfileDocument = {
    id: uid,
    displayName,
    steam64Id,
    parsedDemos: [],
  };
  const writeResult = await profilesCollection().doc(profile.id).set(profile);

  const user = authUser.uid(uid);
  await user.flags.hasProfile
    .set()
    .then(() => user.flags.needsProfile.unset())
    .then(() => user.roles.add("user"));

  functions.logger.log(
    `Created profile for ${displayName} (uid: ${uid}) at ${writeResult.writeTime
      .toDate()
      .toISOString()}`
  );
  return profile;
};
