import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAvPeVBPFkgHKyjH_xXzDvI65flicNFUAc",
  authDomain: "pocketgrocery-5fd1f.firebaseapp.com",
  projectId: "pocketgrocery-5fd1f",
  storageBucket: "pocketgrocery-5fd1f.firebasestorage.app",
  messagingSenderId: "75115921613",
  appId: "1:75115921613:web:263e119371998572cb2984",
  measurementId: "G-PS66PY5X5Y"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics conditionally (it only works in the browser)
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export { app };