import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { ProfileDocument } from "./Profile";
import { ParsedDemoDocument, ParsedDemoDocumentMeta } from "./ParsedDemo";

function getTypedCollection<T>(collectionName: string) {
  const converter: FirestoreDataConverter<T> = {
    toFirestore(document: T) {
      return document;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return snapshot.data() as T;
    },
  };
  return admin.firestore().collection(collectionName).withConverter(converter);
}

export type { ProfileDocument, ParsedDemoDocument };

export function profilesCollection() {
  return getTypedCollection<ProfileDocument>("profiles");
}

export function parsedDemosCollection() {
  return getTypedCollection<ParsedDemoDocument & ParsedDemoDocumentMeta>(
    "parsed-demos"
  );
}
