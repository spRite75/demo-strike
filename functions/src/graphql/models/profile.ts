import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

interface IProfile {
  readonly id: string;
  displayName: string;
  steamId?: string;
}

export class Profile implements IProfile {
  readonly id: string;
  displayName: string;
  steamId?: string;

  constructor(props: IProfile) {
    this.id = props.id;
    this.displayName = props.displayName;
    this.steamId = props.steamId;
  }
}

const converter: FirestoreDataConverter<Profile> = {
  toFirestore({ id, displayName, steamId }: IProfile) {
    return { id, displayName, steamId };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Profile {
    const data = snapshot.data() as IProfile;
    return new Profile(data);
  },
};

export function profileCollection() {
  return admin.firestore().collection("profiles").withConverter(converter);
}
