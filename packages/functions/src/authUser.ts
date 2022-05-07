import * as admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { UserRecord } from "firebase-functions/v1/auth";

/** Valid names for flags */
export type FlagName = "hasProfile";

/** Generates methods for controlling a boolean value in the customClaims of a user. Use within the `authUser` object */
function flagGenerator(
  flagName: FlagName,
  getCustomClaims: () => Promise<{ [key: string]: any }>,
  updateFn: (newClaims: { [key: string]: any }) => Promise<void>
) {
  return {
    /** Get the boolean value of the flag */
    get: async () => !!(await getCustomClaims())[flagName],

    /** Set flag to true */
    set: () => {
      const newClaims = {} as any;
      newClaims[flagName] = true;
      return updateFn(newClaims);
    },

    /** Set flag to false */
    unset: () => {
      const newClaims = {} as any;
      newClaims[flagName] = false;
      return updateFn(newClaims);
    },
  };
}

/** Valid values for Roles */
export type Role = "user" | "admin";

/** Over-thought API for backend managing user flags and roles which will be included in their JWT */
export const authUser = {
  /** Select a user by their id */
  uid: (uid: string) => {
    const getUser = () => admin.auth().getUser(uid);
    const getCustomClaims = () =>
      getUser().then((user) => user.customClaims || {});

    const updateCustomClaims = async (newClaims: { [key: string]: any }) =>
      admin.auth().setCustomUserClaims(uid, {
        ...(await getCustomClaims()),
        ...newClaims,
      });

    const getRolesFromUserRecord = (user: UserRecord) =>
      (user.customClaims?.roles || []) as Role[];

    const updateRoles = async (roles: Role[]) => updateCustomClaims({ roles });

    return {
      /** boolean values which indicate things about a user */
      flags: {
        /** user has successfully initialised their profile */
        hasProfile: flagGenerator(
          "hasProfile",
          getCustomClaims,
          updateCustomClaims
        ),
      },

      /** roles a user should be associated with */
      roles: {
        /** Get a list roles on this user */
        list: () => getUser().then(getRolesFromUserRecord),

        /** Add a role to this user (does nothing if the user already has this role) */
        add: async (newRole: Role) => {
          const roles = await getUser().then(getRolesFromUserRecord);
          if (roles.some((role) => role === newRole)) return Promise.resolve();
          return updateRoles([...roles, newRole]);
        },

        /** Remove a role from this user */
        remove: async (targetRole: Role) => {
          const roles = await getUser().then(getRolesFromUserRecord);
          return updateRoles(roles.filter((role) => role !== targetRole));
        },
      },
    };
  },
};

export const extractUserTokenData = (decodedIdToken: DecodedIdToken) => ({
  uid: decodedIdToken.uid,
  roles: Array.isArray(decodedIdToken.roles)
    ? (decodedIdToken.roles as Role[])
    : ([] as Role[]),
  flags: { hasProfile: !!decodedIdToken.hasProfile },
});
