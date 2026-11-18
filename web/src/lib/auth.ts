/**
 * Firebase Auth — only imported by the /admin route, so public pages never
 * download the auth SDK.
 */
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);
auth.languageCode = 'pt-BR';

export type { User };

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export const signOut = () => fbSignOut(auth);

export const watchUser = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);
