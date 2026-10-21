import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserPreferences, UserProfile } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (using designated databaseId if present)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: 110,
  theme: 'light',
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
  colorBlindMode: 'none',
  ttsVoice: '',
  ttsSpeed: 1.0,
  language: 'en',
  hapticFeedback: true,
  disabilityTypes: [],
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyMedicalNotes: '',
  emergencyBloodType: '',
  emergencyAllergies: '',
};

const GUEST_STORAGE_KEY = 'accessnav_guest_profile';

// Auth functions
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function signUpWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logOut(): Promise<void> {
  localStorage.removeItem(GUEST_STORAGE_KEY);
  await signOut(auth);
}

// User Profile & Preferences Firestore Management
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore, using fallback:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (profile.isGuest) {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
    return;
  }
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    await setDoc(userDocRef, profile, { merge: true });
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
    // Fallback to local storage
    localStorage.setItem(`accessnav_user_${profile.uid}`, JSON.stringify(profile));
  }
}

// Guest session helpers
export function getGuestProfile(): UserProfile | null {
  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function createGuestSession(): UserProfile {
  const guest: UserProfile = {
    uid: 'guest_' + Math.random().toString(36).substring(2, 9),
    email: null,
    displayName: 'Guest Explorer',
    photoURL: null,
    isGuest: true,
    onboardingComplete: false,
    preferences: { ...DEFAULT_PREFERENCES },
  };
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guest));
  return guest;
}

// Save history item (transcripts, scene scans, routes)
export async function saveHistoryItem(
  uid: string,
  item: { type: string; title: string; content: string }
): Promise<void> {
  const payload = {
    ...item,
    userId: uid,
    timestamp: new Date().toISOString(),
  };

  if (uid.startsWith('guest_')) {
    const key = `accessnav_history_${uid}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(payload);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    return;
  }

  try {
    const historyCol = collection(db, 'users', uid, 'saved');
    await addDoc(historyCol, payload);
  } catch (e) {
    console.warn('Firestore history save fallback:', e);
    const key = `accessnav_history_${uid}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(payload);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
