import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/index';

export interface UserProfile {
  uid: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
}

const COLLECTION = 'users';

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const docRef = doc(db, COLLECTION, userId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    const defaultProfile: UserProfile = {
      uid: userId,
      mfaEnabled: false
    };
    await setDoc(docRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      uid: userId,
      mfaEnabled: false
    };
  }
}

export async function updateUserProfileMfa(userId: string, enabled: boolean, secret?: string, backupCodes?: string[]) {
  const docRef = doc(db, COLLECTION, userId);
  try {
    const updates: any = {
      mfaEnabled: enabled
    };
    if (secret !== undefined) {
      updates.mfaSecret = secret;
    }
    if (backupCodes !== undefined) {
      updates.mfaBackupCodes = backupCodes;
    } else if (!enabled) {
      updates.mfaBackupCodes = [];
      updates.mfaSecret = '';
    }
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    console.error('Error updating MFA in profile:', error);
    throw error;
  }
}
