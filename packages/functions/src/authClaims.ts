import * as admin from "firebase-admin";

/** Methods for setting the `hasProfile` flag on a user in the Authentication service */
export const hasProfile = {
  getFromUid: (uid: string) =>
    admin
      .auth()
      .getUser(uid)
      .then((user) => !!user.customClaims?.hasProfile),
  set: (uid: string) =>
    admin.auth().setCustomUserClaims(uid, { hasProfile: true }),
  unset: (uid: string) =>
    admin.auth().setCustomUserClaims(uid, { hasProfile: false }),
};
