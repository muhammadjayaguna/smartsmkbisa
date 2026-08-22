import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDUnOf6IDakX6yYBOYwi9Qz4phV1RWOrPw",
  authDomain: "lomba-9a6c0.firebaseapp.com",
  projectId: "lomba-9a6c0",
  storageBucket: "lomba-9a6c0.firebasestorage.app",
  messagingSenderId: "645329669823",
  appId: "1:645329669823:web:c79fd6b01d47ca9395400a",
  measurementId: "G-90ESG4HTZJ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
