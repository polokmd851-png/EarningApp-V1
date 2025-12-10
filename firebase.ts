// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgaF__GMQLqDATz5RuPHoP093LFdSr4ws",
  authDomain: "earningappbd-7562c.firebaseapp.com",
  projectId: "earningappbd-7562c",
  storageBucket: "earningappbd-7562c.firebasestorage.app",
  messagingSenderId: "113140819610",
  appId: "1:113140819610:web:1cf8060ab173d53a4f2123",
  measurementId: "G-B6PGN2VXHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();