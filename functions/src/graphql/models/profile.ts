import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

interface IProfile {
  displayName: string;
  steamId?: string;
}

export class Profile implements IProfile {
  displayName: string;
  steamId?: string;

  constructor(props: IProfile) {
    this.displayName = props.displayName;
    this.steamId = props.steamId;
  }
}

const converter: FirestoreDataConverter<Profile> = {
  toFirestore({ displayName, steamId }: IProfile) {
    return { displayName, steamId };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Profile {
    const data = snapshot.data() as IProfile;
    return new Profile(data);
  },
};

export function profileCollection() {
  return admin.firestore().collection("profiles").withConverter(converter);
}
