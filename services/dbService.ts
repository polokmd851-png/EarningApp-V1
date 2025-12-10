import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';
import { DEFAULT_USER } from '../constants';

export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const createNewUser = async (uid: string, email: string | null, name: string | null = 'New User'): Promise<User> => {
  const newUser: User = {
    ...DEFAULT_USER,
    id: uid,
    name: name || 'User',
    email: email || '',
    inventory: [],
    pendingSales: [],
    investments: [],
    cryptoPortfolio: [],
    // Add timestamp if needed for internal sorting, though not in User type
  };

  try {
    // We use setDoc with merge: true to avoid overwriting if somehow exists, 
    // but typically for new user we just set.
    await setDoc(doc(db, 'users', uid), {
      ...newUser,
      createdAt: serverTimestamp()
    });
    return newUser;
  } catch (error) {
    console.error("Error creating user data:", error);
    throw error;
  }
};

export const updateUserData = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user data:", error);
  }
};