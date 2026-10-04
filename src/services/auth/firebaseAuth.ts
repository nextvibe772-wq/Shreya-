import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Sheets scope requested
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
type AuthCallback = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthCallback>();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      notifyListeners(user, cachedAccessToken);
    } else if (!user) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
      notifyListeners(null, null);
    } else if (!isSigningIn && !cachedAccessToken) {
      // User is logged in to Firebase session but access token requires fresh user interaction
      if (onAuthFailure) onAuthFailure();
      notifyListeners(user, null);
    }
  });
};

export const subscribeToAuth = (callback: AuthCallback) => {
  listeners.add(callback);
  callback(auth.currentUser, cachedAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = (user: User | null, token: string | null) => {
  listeners.forEach((listener) => listener(user, token));
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token for Sheets.');
    }
    cachedAccessToken = credential.accessToken;
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  notifyListeners(null, null);
};
