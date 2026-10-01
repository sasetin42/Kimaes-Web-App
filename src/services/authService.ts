// Firebase Authentication & User Profile Sync Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { User, UserRole } from '@/types';
import { INITIAL_STAFF } from '@/constants/seedData';

const USERS_COLLECTION = 'users';
const LOCAL_AUTH_KEY = 'kimae_auth_user';

export interface AuthStateChangeCallback {
  (user: User | null): void;
}

/**
 * Super Admin Credentials requirement:
 * admin@gmail.com / 123456# / role: super_admin
 */
const SUPER_ADMIN_EMAIL = 'admin@gmail.com';
const SUPER_ADMIN_DEFAULT: User = {
  id: 'super-admin-001',
  name: 'System Administrator',
  email: SUPER_ADMIN_EMAIL,
  mobile: '0917-000-0000',
  role: 'super_admin',
  status: 'active',
  permissions: ['all'],
  createdAt: '2025-01-01T00:00:00.000Z',
  addresses: [],
};

// Local storage session helpers for seamless offline/demo operation
export function getLocalAuthUser(): User | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalAuthUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_KEY);
    }
    window.dispatchEvent(new CustomEvent('kimae_auth_change', { detail: user }));
  } catch (err) {
    console.warn('Error saving local auth user:', err);
  }
}

export function isStaffUser(): boolean {
  const user = getLocalAuthUser();
  if (!user) return false;
  return ['super_admin', 'admin', 'manager', 'cashier', 'inventory_staff', 'kitchen', 'rider'].includes(user.role);
}

export function isAdminUser(): boolean {
  const user = getLocalAuthUser();
  if (!user) return false;
  return ['super_admin', 'admin'].includes(user.role);
}

/**
 * Validates that the user has an active Firebase Auth session that matches staff privileges.
 * Cloud Firestore security rules require request.auth != null for staff queries.
 */
export function hasFirestoreStaffAccess(): boolean {
  return Boolean(auth.currentUser && isStaffUser());
}

export function hasFirestoreAdminAccess(): boolean {
  return Boolean(auth.currentUser && isAdminUser());
}

/**
 * Helper to transform Firestore doc data to User model
 */
export function mapDocToUser(docId: string, data: any): User {
  return {
    id: docId,
    name: data.name || 'User',
    email: data.email || '',
    mobile: data.mobile || '',
    role: (data.role || 'customer') as UserRole,
    avatar: data.avatar || '',
    pin: data.pin || '',
    status: data.status || 'active',
    permissions: data.permissions || (data.role === 'super_admin' ? ['all'] : []),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
    addresses: data.addresses || [],
  };
}

/**
 * Auto-bootstrap super_admin profile in Firestore
 */
async function ensureAdminProfile(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const isSuperAdmin = firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isSuperAdmin ? 'super_admin' : 'customer';

    const newUserData = {
      name: isSuperAdmin ? 'System Administrator' : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'),
      email: firebaseUser.email || '',
      mobile: '0917-000-0000',
      role,
      status: 'active',
      permissions: isSuperAdmin ? ['all'] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, newUserData);
    return mapDocToUser(firebaseUser.uid, newUserData);
  }

  // If already exists but email is super_admin and not marked super_admin yet
  const existing = snap.data();
  if (firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && existing.role !== 'super_admin') {
    await updateDoc(userRef, {
      role: 'super_admin',
      permissions: ['all'],
      updatedAt: serverTimestamp(),
    });
    existing.role = 'super_admin';
    existing.permissions = ['all'];
  }

  return mapDocToUser(firebaseUser.uid, existing);
}

/**
 * Listen to user auth state and live Firestore profile
 */
export function subscribeToAuth(callback: AuthStateChangeCallback): () => void {
  let unsubUserDoc: (() => void) | null = null;

  // Real-time listener for local auth changes (offline / demo fallback)
  const handleLocalAuthChange = (e: any) => {
    callback(e.detail);
  };
  window.addEventListener('kimae_auth_change', handleLocalAuthChange);

  // If initial local user exists, emit immediately
  const localUser = getLocalAuthUser();
  if (localUser) {
    callback(localUser);
  }

  const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    if (unsubUserDoc) {
      unsubUserDoc();
      unsubUserDoc = null;
    }

    if (!firebaseUser) {
      // If we don't have a local demo user either, callback null
      if (!getLocalAuthUser()) {
        callback(null);
      }
      return;
    }

    try {
      // Ensure user profile document exists
      const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await ensureAdminProfile(firebaseUser);
      }

      // Subscribe to real-time changes of the user profile document
      unsubUserDoc = onSnapshot(userRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const u = mapDocToUser(profileSnap.id, profileSnap.data());
          setLocalAuthUser(u);
          callback(u);
        } else {
          callback(null);
        }
      }, (error) => {
        console.warn('User profile snapshot error:', error);
      });
    } catch (err) {
      console.error('Error fetching user profile from Firestore:', err);
      // Fallback object from Auth token while offline
      const fallbackUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        mobile: '',
        role: (firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'super_admin' : 'customer') as UserRole,
        createdAt: new Date().toISOString(),
      };
      setLocalAuthUser(fallbackUser);
      callback(fallbackUser);
    }
  });

  return () => {
    unsubAuth();
    if (unsubUserDoc) unsubUserDoc();
    window.removeEventListener('kimae_auth_change', handleLocalAuthChange);
  };
}

/**
 * Sign in using Firebase Authentication with robust offline/demo fallback
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Direct Super Admin demo match
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() && pass === '123456#') {
    // Attempt to authenticate with Firebase Auth so Firestore security rules recognize the session
    try {
      const cred = await signInWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, '123456#');
      const userProfile = await ensureAdminProfile(cred.user);
      setLocalAuthUser(userProfile);
      return userProfile;
    } catch {
      try {
        const cred = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, '123456#');
        const userProfile = await ensureAdminProfile(cred.user);
        setLocalAuthUser(userProfile);
        return userProfile;
      } catch {
        // Fall back to local admin session if offline or blocked
        setLocalAuthUser(SUPER_ADMIN_DEFAULT);
        return SUPER_ADMIN_DEFAULT;
      }
    }
  }

  // 2. Check seed staff members
  const staffMatch = INITIAL_STAFF.find(s => s.email.toLowerCase() === cleanEmail);
  if (staffMatch && (pass === '123456#' || pass === staffMatch.pin)) {
    try {
      const cred = await signInWithEmailAndPassword(auth, staffMatch.email, '123456#');
      const userProfile = await ensureAdminProfile(cred.user);
      setLocalAuthUser(userProfile);
      return userProfile;
    } catch {
      setLocalAuthUser(staffMatch);
      return staffMatch;
    }
  }

  // 3. Standard Firebase Auth
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const userProfile = await ensureAdminProfile(cred.user);
    setLocalAuthUser(userProfile);
    return userProfile;
  } catch (firebaseErr: any) {
    // If local user exists with matching email
    const local = getLocalAuthUser();
    if (local && local.email.toLowerCase() === cleanEmail) {
      return local;
    }
    throw firebaseErr;
  }
}

/**
 * Register a new user using Firebase Authentication and save profile to Firestore
 */
export async function registerWithEmail(
  name: string,
  email: string,
  mobile: string,
  pass: string,
  role: UserRole = 'customer'
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const isSuper = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
  const assignedRole: UserRole = isSuper ? 'super_admin' : role;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(cred.user, { displayName: name });

    const userDocRef = doc(db, USERS_COLLECTION, cred.user.uid);
    const profileData = {
      name,
      email: cred.user.email || email.trim(),
      mobile: mobile.trim(),
      role: assignedRole,
      status: 'active',
      permissions: assignedRole === 'super_admin' ? ['all'] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, profileData);
    const newUser = mapDocToUser(cred.user.uid, profileData);
    setLocalAuthUser(newUser);
    return newUser;
  } catch (err: any) {
    // Fallback: If Firebase is not configured or fails network/API, store user locally
    if (err?.code === 'auth/api-key-not-valid' || err?.code === 'auth/network-request-failed' || err?.message?.includes('API key not valid')) {
      const localFallbackUser: User = {
        id: `local-user-${Date.now()}`,
        name,
        email: email.trim(),
        mobile: mobile.trim(),
        role: assignedRole,
        status: 'active',
        permissions: assignedRole === 'super_admin' ? ['all'] : [],
        createdAt: new Date().toISOString(),
      };
      setLocalAuthUser(localFallbackUser);
      return localFallbackUser;
    }
    throw err;
  }
}

/**
 * Sign out of Firebase Authentication
 */
export async function logoutUser(): Promise<void> {
  setLocalAuthUser(null);
  try {
    await signOut(auth);
  } catch {
    // Graceful offline sign out
  }
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
  const current = getLocalAuthUser();
  if (current && current.id === uid) {
    setLocalAuthUser({ ...current, ...updates });
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not update Firestore profile remotely:', err);
  }
}

/**
 * Utility: Provision the initial Super Administrator (admin@gmail.com / 123456#)
 */
export async function bootstrapInitialSuperAdmin(): Promise<{ success: boolean; message: string }> {
  // Check if Firebase Auth API is properly configured
  if (!isFirebaseConfigured) {
    return { success: true, message: 'Running with local demo configuration; super admin initialized.' };
  }

  // If already authenticated as super_admin, nothing needed
  if (auth.currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: true, message: 'Super admin already signed in.' };
  }

  // Avoid firing unprompted signup network calls on every unauthenticated page load
  // If user is not signed in, ensure local super admin profile fallback is ready in storage
  const local = getLocalAuthUser();
  if (local && local.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: true, message: 'Super admin session cached locally.' };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, '123456#');
    await updateProfile(cred.user, { displayName: 'System Administrator' });
    const userRef = doc(db, USERS_COLLECTION, cred.user.uid);
    await setDoc(userRef, {
      name: 'System Administrator',
      email: SUPER_ADMIN_EMAIL,
      mobile: '0917-000-0000',
      role: 'super_admin',
      status: 'active',
      permissions: ['all'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Super admin initialized in Firebase Auth & Firestore!' };
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      return { success: true, message: 'Super admin already exists in Firebase Auth.' };
    }
    // Gracefully handle credential / network / 400 errors without crashing or logging unhandled rejections
    return { success: false, message: err?.message || 'Authentication not provisioned' };
  }
}
