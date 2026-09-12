import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Bet, NFLWeeklyGame } from '../types';
import firebaseConfig from './firebaseConfig';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom database ID from config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth Methods
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
};

export const registerWithEmail = async (email: string, pass: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
};

export const loginAsGuest = async (): Promise<User> => {
  const cred = await signInAnonymously(auth);
  return cred.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Firestore Sync Services for Bets
export const subscribeToBets = (
  userId: string, 
  onUpdate: (bets: Bet[]) => void,
  onError?: (err: Error) => void
) => {
  const betsCollection = collection(db, 'users', userId, 'bets');
  const q = query(betsCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const loadedBets: Bet[] = [];
    snapshot.forEach((docSnap) => {
      loadedBets.push({
        id: docSnap.id,
        ...docSnap.data()
      } as Bet);
    });
    onUpdate(loadedBets);
  }, (error) => {
    console.error('Firestore bets subscription error:', error);
    if (onError) onError(error);
  });
};

export const syncBetToCloud = async (userId: string, bet: Bet): Promise<void> => {
  const betDoc = doc(db, 'users', userId, 'bets', bet.id);
  // Sanitize undefined fields for Firestore
  const data: Record<string, any> = { ...bet };
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });
  data.userId = userId;
  data.updatedAt = Date.now();
  await setDoc(betDoc, data, { merge: true });
};

export const deleteBetFromCloud = async (userId: string, betId: string): Promise<void> => {
  const betDoc = doc(db, 'users', userId, 'bets', betId);
  await deleteDoc(betDoc);
};

// User Profile & Settings
export interface UserCloudProfile {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  startingBankroll: number;
  unitSize: number;
  updatedAt?: any;
}

export const saveCloudSettings = async (
  userId: string, 
  settings: { startingBankroll: number; unitSize: number },
  userMeta?: { email?: string | null; displayName?: string | null }
): Promise<void> => {
  const userDoc = doc(db, 'users', userId);
  await setDoc(userDoc, {
    userId,
    startingBankroll: settings.startingBankroll,
    unitSize: settings.unitSize,
    email: userMeta?.email || null,
    displayName: userMeta?.displayName || null,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const fetchCloudSettings = async (userId: string): Promise<UserCloudProfile | null> => {
  try {
    const userDoc = doc(db, 'users', userId);
    const snap = await getDoc(userDoc);
    if (snap.exists()) {
      return snap.data() as UserCloudProfile;
    }
  } catch (e) {
    console.warn('Could not fetch cloud settings', e);
  }
  return null;
};

// Batch upload local bets to cloud upon initial sign-in
export const batchUploadLocalBets = async (userId: string, localBets: Bet[]): Promise<void> => {
  for (const bet of localBets) {
    await syncBetToCloud(userId, bet);
  }
};
