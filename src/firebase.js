import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBtYrWQDgpV0BwqOGlD0uYDUF2rOWDsjFg",
  authDomain: "dtrexasai-7c16c.firebaseapp.com",
  projectId: "dtrexasai-7c16c",
  storageBucket: "dtrexasai-7c16c.firebasestorage.app",
  messagingSenderId: "826750818157",
  appId: "1:826750818157:web:034a5ee5c130ce8ff0ac64",
  measurementId: "G-8N3EQWXBE9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);
