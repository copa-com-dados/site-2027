/** Admin-side writes for the `people` collection. Security rules only allow allowlisted admins. */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PersonSchema, type Person, type PersonInput } from '../types/schema';

const people = collection(db, 'people');

/** Live list of everyone, including hidden people. */
export function watchAllPeople(onData: (people: Person[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(people, orderBy('order')),
    (snap) => {
      const list: Person[] = [];
      snap.forEach((d) => {
        const parsed = PersonSchema.safeParse(d.data());
        if (parsed.success) list.push({ ...parsed.data, id: d.id });
        else console.warn(`[people] ignoring invalid doc ${d.id}`, parsed.error.issues);
      });
      onData(list);
    },
    onError,
  );
}

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    return (await getDoc(doc(db, 'admins', email))).exists();
  } catch {
    return false; // permission-denied => not an admin
  }
}

export async function savePerson(id: string | null, data: PersonInput, editorEmail: string) {
  const clean = PersonSchema.parse(data);
  const ref = id ? doc(people, id) : doc(people);
  await setDoc(ref, { ...clean, updatedAt: serverTimestamp(), updatedBy: editorEmail });
  return ref.id;
}

export const deletePerson = (id: string) => deleteDoc(doc(people, id));

/** Swaps the `order` of two people (used by the up/down buttons). */
export async function swapOrder(a: Person, b: Person) {
  const batch = writeBatch(db);
  batch.update(doc(people, a.id), { order: b.order, updatedAt: serverTimestamp() });
  batch.update(doc(people, b.id), { order: a.order, updatedAt: serverTimestamp() });
  await batch.commit();
}
