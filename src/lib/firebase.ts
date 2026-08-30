import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  updateDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';

// Support Vercel / CI production environment variables with seamless fallback to applet config
const resolvedFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || fallbackConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId || '',
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || fallbackConfig.oAuthClientId || '',
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || fallbackConfig.recaptchaSiteKey || '',
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

// Auth with Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore with custom database ID from config if present
export const db = resolvedFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export {
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  updateDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  GoogleAuthProvider,
};
export type { FirebaseUser };
