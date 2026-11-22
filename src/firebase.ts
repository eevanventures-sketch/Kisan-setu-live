import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { MandiPatrakRow, SavedCustomPatrak } from './data/patrakData';

export const ADMIN_EMAIL = 'dev.rgu201@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function isVerifiedAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

function sanitizeId(raw: string, fallback = 'default-id'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  return cleaned.length >= 2 ? cleaned : fallback;
}

function clampString(raw: unknown, minLen: number, maxLen: number, fallback: string): string {
  const str = String(raw ?? '').trim();
  if (str.length < minLen) return fallback;
  return str.slice(0, maxLen);
}

export interface PublishPatrakInput {
  mandiId: string;
  mandiName: string;
  district: string;
  state: string;
  date: string; // DD-MM-YYYY
  totalContracts: number | string;
  totalArrival: number | string;
  arrivalUnit: 'बोरी' | 'क्विंटल';
  releaseTime: string;
  sourceType: 'photo_scan' | 'manual_official' | 'govt_sync';
  rows: MandiPatrakRow[];
}

export async function publishMandiPatrakToCloud(input: PublishPatrakInput): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('क्लाउड पर पब्लिश करने के लिए कृपया पहले Google से लॉगिन करें।');
  }
  if (!isVerifiedAdminUser(user)) {
    throw new Error(`केवल अधिकृत एडमिन (${ADMIN_EMAIL}) ही लाइव मंडी भाव पब्लिश कर सकते हैं।`);
  }

  const safeMandiId = sanitizeId(input.mandiId, 'mp-vidisha-ganjbasoda');
  const safeDate = /^\d{2}-\d{2}-\d{4}$/.test(input.date) ? input.date : '01-01-2026';
  const docId = sanitizeId(`${safeMandiId}__${safeDate}`, 'patrak-latest');
  const docPath = `mandiPatraks/${docId}`;

  const safeUnit: 'बोरी' | 'क्विंटल' = input.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी';
  const sanitizedRows = (input.rows || []).slice(0, 60).map((r, idx) => ({
    sNo: Number(r.sNo) || idx + 1,
    cropName: clampString(r.cropName, 1, 80, `फसल ${idx + 1}`),
    contracts: r.contracts === '-' ? '-' : Number(r.contracts) || 0,
    arrival: r.arrival === '-' ? '-' : Number(r.arrival) || 0,
    arrivalUnit: safeUnit,
    minPrice: Number(r.minPrice) || 0,
    maxPrice: Number(r.maxPrice) || 0,
    modalPrice: Number(r.modalPrice) || 0,
    yesterdayPrice: Number(r.yesterdayPrice) || 0,
    priceChange: Number(r.priceChange) || 0,
    msp: typeof r.msp === 'number' ? r.msp : String(r.msp ?? '-'),
  }));

  if (sanitizedRows.length === 0) {
    throw new Error('कम से कम 1 फसल की पंक्ति आवश्यक है।');
  }

  const payload = {
    mandiId: safeMandiId,
    mandiName: clampString(input.mandiName, 2, 150, 'कृषि उपज मंडी'),
    district: clampString(input.district, 2, 100, 'विदिशा'),
    state: clampString(input.state, 2, 100, 'मध्य प्रदेश'),
    date: safeDate,
    totalContracts: clampString(input.totalContracts, 1, 40, '0'),
    totalArrival: clampString(input.totalArrival, 1, 40, '0'),
    arrivalUnit: safeUnit,
    releaseTime: clampString(input.releaseTime, 2, 200, 'सायं 5:30 बजे क्लाउड ऑटो-सिंक'),
    sourceType: input.sourceType,
    rows: sanitizedRows,
    updatedByUid: user.uid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'mandiPatraks', docId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeToMandiPatraks(
  onData: (patraks: Record<string, SavedCustomPatrak>) => void,
  onSyncError?: (err: unknown) => void
): Unsubscribe {
  const path = 'mandiPatraks';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const map: Record<string, SavedCustomPatrak> = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (!d || typeof d.mandiId !== 'string' || typeof d.date !== 'string' || !Array.isArray(d.rows)) {
          return;
        }
        const key = `${d.mandiId}__${d.date}`;
        const updatedIso =
          d.updatedAt && typeof d.updatedAt.toDate === 'function'
            ? d.updatedAt.toDate().toISOString()
            : new Date().toISOString();
        map[key] = {
          mandiId: d.mandiId,
          date: d.date,
          totalContracts: d.totalContracts ?? 0,
          totalArrival: String(d.totalArrival ?? '0'),
          arrivalUnit: d.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी',
          releaseTime: String(d.releaseTime ?? 'क्लाउड ऑटो-सिंक प्रमाणित पत्रक'),
          rows: d.rows,
          updatedAt: updatedIso,
        };
      });
      onData(map);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onSyncError) onSyncError(wrapped);
      }
    }
  );
}

export interface UserFavoriteMandiPref {
  userId: string;
  favoriteMandiId: string;
  favoriteState: string;
  favoriteDistrict: string;
}

export function subscribeToUserPreference(
  user: User,
  onData: (pref: UserFavoriteMandiPref | null) => void
): Unsubscribe {
  const path = `userPreferences/${user.uid}`;
  return onSnapshot(
    doc(db, 'userPreferences', user.uid),
    (docSnap) => {
      if (!docSnap.exists()) {
        onData(null);
        return;
      }
      const d = docSnap.data();
      if (d?.favoriteMandiId && d?.favoriteState && d?.favoriteDistrict) {
        onData({
          userId: user.uid,
          favoriteMandiId: String(d.favoriteMandiId),
          favoriteState: String(d.favoriteState),
          favoriteDistrict: String(d.favoriteDistrict),
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveUserPreferenceToCloud(pref: {
  favoriteMandiId: string;
  favoriteState: string;
  favoriteDistrict: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const path = `userPreferences/${user.uid}`;
  const payload = {
    userId: user.uid,
    favoriteMandiId: sanitizeId(pref.favoriteMandiId, 'mp-vidisha-ganjbasoda'),
    favoriteState: clampString(pref.favoriteState, 2, 100, 'मध्य प्रदेश'),
    favoriteDistrict: clampString(pref.favoriteDistrict, 2, 100, 'विदिशा'),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'userPreferences', user.uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
