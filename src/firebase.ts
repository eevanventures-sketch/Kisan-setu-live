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
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { MandiPatrakRow, SavedCustomPatrak } from './data/patrakData';
import type { MarketListing } from './types';

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

// =========================================================================
// FARMER ACCOUNT & PRIVATE PROFILE (/users/{uid})
// =========================================================================

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string;
  village: string;
  district: string;
  state: string;
  phone: string;
  role: 'farmer' | 'admin';
}

export async function syncUserProfileOnLogin(user: User): Promise<UserProfileData | null> {
  if (!user || !user.emailVerified || !user.email) return null;
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        uid: user.uid,
        displayName: String(d.displayName || user.displayName || 'किसान भाई'),
        email: String(d.email || user.email),
        photoUrl: String(d.photoUrl || user.photoURL || ''),
        village: String(d.village || ''),
        district: String(d.district || ''),
        state: String(d.state || 'मध्य प्रदेश'),
        phone: String(d.phone || ''),
        role: d.role === 'admin' ? 'admin' : 'farmer',
      };
    }

    const displayName = clampString(
      user.displayName || user.email.split('@')[0] || 'किसान भाई',
      2,
      100,
      'किसान भाई'
    );
    const email = clampString(user.email, 3, 150, 'farmer@kisansetu.in');
    const photoUrl = clampString(user.photoURL || '', 0, 500, '');

    await setDoc(ref, {
      uid: user.uid,
      displayName,
      email,
      photoUrl,
      village: '',
      district: '',
      state: 'मध्य प्रदेश',
      phone: '',
      role: 'farmer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      uid: user.uid,
      displayName,
      email,
      photoUrl,
      village: '',
      district: '',
      state: 'मध्य प्रदेश',
      phone: '',
      role: 'farmer',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserProfile(
  user: User,
  onData: (profile: UserProfileData | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `users/${user.uid}`;
  return onSnapshot(
    doc(db, 'users', user.uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData({
        uid: user.uid,
        displayName: String(d.displayName || user.displayName || 'किसान भाई'),
        email: String(d.email || user.email || ''),
        photoUrl: String(d.photoUrl || user.photoURL || ''),
        village: String(d.village || ''),
        district: String(d.district || ''),
        state: String(d.state || 'मध्य प्रदेश'),
        phone: String(d.phone || ''),
        role: d.role === 'admin' ? 'admin' : 'farmer',
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export async function updateUserProfileInCloud(input: {
  displayName: string;
  village: string;
  district: string;
  state: string;
  phone: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('AUTH_REQUIRED');
  }
  const path = `users/${user.uid}`;
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: clampString(input.displayName, 2, 100, 'किसान भाई'),
      photoUrl: clampString(user.photoURL || '', 0, 500, ''),
      village: clampString(input.village, 0, 100, ''),
      district: clampString(input.district, 0, 100, ''),
      state: clampString(input.state, 0, 100, ''),
      phone: clampString(input.phone, 0, 25, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMyAccountDataInCloud(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('AUTH_REQUIRED');
  }
  const profilePath = `users/${user.uid}`;
  const prefPath = `userPreferences/${user.uid}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, profilePath);
  }
  try {
    await deleteDoc(doc(db, 'userPreferences', user.uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, prefPath);
  }
  await signOutFirebase();
}

// =========================================================================
// KISAN BAZAAR — SHARED CLOUD LISTINGS & REELS CHUNKED VIDEO STORAGE
// =========================================================================

const cloudVideoBlobCache = new Map<string, string>();
const CHUNK_BASE64_SIZE = 700000; // < 750KB rule limit & safely < 1MB Firestore doc limit
const MAX_CLOUD_VIDEO_CHUNKS = 20; // Matches firestore.rules (totalChunks <= 20 => ~10.5 MB raw video)

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const blockSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += blockSize) {
    const chunk = bytes.subarray(i, i + blockSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function normalizePlayableVideoMime(rawMime?: string): string {
  const m = String(rawMime || '').trim().toLowerCase();
  if (!m || m === 'application/octet-stream' || m === 'video/quicktime') {
    return 'video/mp4';
  }
  return m;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const cleanB64 = base64.replace(/\s+/g, '');
  const binary = atob(cleanB64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: normalizePlayableVideoMime(mimeType) });
}

export interface PublishBazaarListingInput {
  id?: string;
  type: MarketListing['type'];
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  quantity: string;
  location: string;
  state: string;
  sellerName: string;
  contactPhone: string;
  mediaType: 'image' | 'video';
  thumbnailData: string;
  externalVideoUrl?: string;
  companyName?: string;
  discountOffer?: string;
  targetPestOrCrop?: string;
  videoFile?: File | null;
  onProgress?: (pct: number) => void;
}

export async function publishBazaarListingToCloud(
  input: PublishBazaarListingInput
): Promise<MarketListing> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('AUTH_REQUIRED');
  }

  const listingId = sanitizeId(input.id || `bazaar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  let videoMediaId = '';
  let videoChunkCount = 0;
  let videoMimeType = '';

  if (input.mediaType === 'video' && input.videoFile) {
    const buf = await input.videoFile.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    const totalChunks = Math.ceil(base64.length / CHUNK_BASE64_SIZE);

    if (totalChunks > MAX_CLOUD_VIDEO_CHUNKS) {
      throw new Error('VIDEO_TOO_LARGE_FOR_FIRESTORE');
    }

    videoMediaId = sanitizeId(`vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    videoMimeType = clampString(normalizePlayableVideoMime(input.videoFile.type), 3, 60, 'video/mp4');
    videoChunkCount = totalChunks;

    for (let i = 0; i < totalChunks; i++) {
      const slice = base64.slice(i * CHUNK_BASE64_SIZE, (i + 1) * CHUNK_BASE64_SIZE);
      const chunkDocId = sanitizeId(`${videoMediaId}_c${i}`);
      const chunkPayload = {
        videoMediaId,
        chunkIndex: i,
        totalChunks,
        mimeType: videoMimeType,
        data: slice,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'bazaarVideoChunks', chunkDocId), chunkPayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `bazaarVideoChunks/${chunkDocId}`);
      }
      if (input.onProgress) {
        input.onProgress(Math.round(((i + 1) / (totalChunks + 1)) * 100));
      }
    }

    // Also cache locally immediately for zero-wait replay by the uploader
    const localBlobUrl = URL.createObjectURL(input.videoFile);
    cloudVideoBlobCache.set(videoMediaId, localBlobUrl);
  }

  const cleanThumb = clampString(input.thumbnailData || '', 0, 250000, '');
  const cleanExternalVideo = clampString(input.externalVideoUrl || '', 0, 500, '');
  const safePrice = Math.max(0, Math.min(100000000, Math.round(Number(input.price) || 0)));

  const payload = {
    authorUid: user.uid,
    type: input.type,
    title: clampString(input.title, 2, 150, 'किसान उत्पाद'),
    description: clampString(input.description, 2, 1000, 'संपर्क करें।'),
    price: safePrice,
    priceUnit: clampString(input.priceUnit, 1, 60, '₹'),
    quantity: clampString(input.quantity, 1, 80, 'उपलब्ध'),
    location: clampString(input.location, 2, 120, 'विदिशा, मध्य प्रदेश'),
    state: clampString(input.state, 2, 60, 'मध्य प्रदेश'),
    sellerName: clampString(input.sellerName, 2, 100, 'किसान भाई'),
    contactPhone: clampString(input.contactPhone, 6, 25, '0000000000'),
    mediaType: input.mediaType,
    thumbnailData: cleanThumb,
    videoMediaId,
    videoChunkCount,
    videoMimeType,
    externalVideoUrl: cleanExternalVideo,
    companyName: clampString(input.companyName || '', 0, 120, ''),
    discountOffer: clampString(input.discountOffer || '', 0, 120, ''),
    targetPestOrCrop: clampString(input.targetPestOrCrop || '', 0, 150, ''),
    likesCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'bazaarListings', listingId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `bazaarListings/${listingId}`);
  }

  if (input.onProgress) input.onProgress(100);

  return {
    id: listingId,
    authorUid: user.uid,
    title: { hi: payload.title, en: payload.title },
    type: payload.type,
    price: payload.price,
    priceUnit: { hi: payload.priceUnit, en: payload.priceUnit },
    quantity: payload.quantity,
    location: { hi: payload.location, en: payload.location },
    state: { hi: payload.state, en: payload.state },
    sellerName: payload.sellerName,
    phone: payload.contactPhone,
    date: 'आज',
    imageUrl: payload.thumbnailData,
    mediaType: payload.mediaType,
    videoUrl:
      (videoMediaId && cloudVideoBlobCache.get(videoMediaId)) ||
      payload.externalVideoUrl ||
      undefined,
    videoMediaId: videoMediaId || undefined,
    videoChunkCount,
    videoMimeType: videoMimeType || undefined,
    externalVideoUrl: payload.externalVideoUrl || undefined,
    description: { hi: payload.description, en: payload.description },
    verified: true,
    isCompanyPromo: payload.type === 'company_promo',
    companyName: payload.companyName || undefined,
    discountOffer: payload.discountOffer || undefined,
    targetPestOrCrop: payload.targetPestOrCrop || undefined,
    likes: 1,
    isCloudPost: true,
    createdAtMs: Date.now(),
  };
}

export async function loadCloudBazaarVideoUrl(
  videoMediaId: string,
  mimeType = 'video/mp4'
): Promise<string> {
  if (cloudVideoBlobCache.has(videoMediaId)) {
    return cloudVideoBlobCache.get(videoMediaId)!;
  }
  const path = 'bazaarVideoChunks';
  try {
    const q = query(collection(db, path), where('videoMediaId', '==', videoMediaId));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('VIDEO_NOT_FOUND');
    }
    const chunks: { chunkIndex: number; totalChunks: number; data: string; mimeType?: string }[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (typeof d.chunkIndex === 'number' && typeof d.data === 'string') {
        chunks.push({
          chunkIndex: d.chunkIndex,
          totalChunks: typeof d.totalChunks === 'number' ? d.totalChunks : 0,
          data: d.data,
          mimeType: typeof d.mimeType === 'string' ? d.mimeType : mimeType,
        });
      }
    });
    if (chunks.length === 0) {
      throw new Error('VIDEO_NOT_FOUND');
    }
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const expectedTotal = chunks[0]?.totalChunks || 0;
    if (expectedTotal > 0 && chunks.length < expectedTotal) {
      throw new Error('VIDEO_CHUNKS_INCOMPLETE');
    }
    const fullBase64 = chunks.map((c) => c.data).join('');
    const finalMime = chunks[0]?.mimeType || mimeType;
    const blob = base64ToBlob(fullBase64, finalMime);
    const url = URL.createObjectURL(blob);
    cloudVideoBlobCache.set(videoMediaId, url);
    return url;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToBazaarListings(
  onData: (items: MarketListing[]) => void,
  onSyncError?: (err: unknown) => void
): Unsubscribe {
  const path = 'bazaarListings';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(80));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MarketListing[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (!d || typeof d.title !== 'string') return;
        const createdMs =
          d.createdAt && typeof d.createdAt.toMillis === 'function'
            ? d.createdAt.toMillis()
            : Date.now();
        const dateText = new Date(createdMs).toLocaleDateString('hi-IN', {
          day: 'numeric',
          month: 'short',
        });
        const cachedVid =
          typeof d.videoMediaId === 'string' && d.videoMediaId
            ? cloudVideoBlobCache.get(d.videoMediaId)
            : undefined;

        items.push({
          id: docSnap.id,
          authorUid: String(d.authorUid || ''),
          title: { hi: d.title, en: d.title },
          type: d.type || 'sell_crop',
          price: Number(d.price) || 0,
          priceUnit: { hi: String(d.priceUnit || '₹'), en: String(d.priceUnit || '₹') },
          quantity: String(d.quantity || 'उपलब्ध'),
          location: { hi: String(d.location || ''), en: String(d.location || '') },
          state: { hi: String(d.state || 'मध्य प्रदेश'), en: String(d.state || 'MP') },
          sellerName: String(d.sellerName || ''),
          phone: String(d.contactPhone || ''),
          date: dateText,
          imageUrl: String(d.thumbnailData || ''),
          mediaType: d.mediaType === 'video' ? 'video' : 'image',
          videoMediaId: d.videoMediaId ? String(d.videoMediaId) : undefined,
          videoChunkCount: Number(d.videoChunkCount) || 0,
          videoMimeType: d.videoMimeType ? String(d.videoMimeType) : undefined,
          externalVideoUrl: d.externalVideoUrl ? String(d.externalVideoUrl) : undefined,
          videoUrl: cachedVid || (d.externalVideoUrl ? String(d.externalVideoUrl) : undefined),
          description: { hi: String(d.description || ''), en: String(d.description || '') },
          verified: true,
          isCompanyPromo: d.type === 'company_promo',
          companyName: d.companyName ? String(d.companyName) : undefined,
          discountOffer: d.discountOffer ? String(d.discountOffer) : undefined,
          targetPestOrCrop: d.targetPestOrCrop ? String(d.targetPestOrCrop) : undefined,
          likes: Number(d.likesCount) || 0,
          isCloudPost: true,
          createdAtMs: createdMs,
        });
      });
      onData(items);
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

export async function likeBazaarListingInCloud(
  listingId: string,
  currentLikes: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const path = `bazaarListings/${listingId}`;
  try {
    await updateDoc(doc(db, 'bazaarListings', listingId), {
      likesCount: currentLikes + 1,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBazaarListingInCloud(
  listingId: string,
  videoMediaId?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('AUTH_REQUIRED');
  }
  if (videoMediaId) {
    try {
      const q = query(collection(db, 'bazaarVideoChunks'), where('videoMediaId', '==', videoMediaId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'bazaarVideoChunks', d.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'bazaarVideoChunks');
    }
  }
  const path = `bazaarListings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'bazaarListings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
