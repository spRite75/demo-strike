import * as functions from "firebase-functions";
import { authUser } from "./authUser";

/** Enable users by changing a document in firestore */
export const activateUser = functions.firestore
  .document("configs/allowedUsers")
  .onUpdate(async (allowedUsers) => {
    const { uids } = allowedUsers.after.data();
    functions.logger.info("Allowed users changed", { uids });
    if (!Array.isArray(uids)) {
      throw new Error("Bad document!");
    }

    await Promise.all(
      uids.map(async (uid) => {
        const user = authUser.uid(uid);
        if (await user.flags.hasProfile.get()) return;
        await user.flags.needsProfile.set();
      })
    );
  });

export { handler as graphql } from "./graphql";
export { handler as parseDemo } from "./parseDemo";
