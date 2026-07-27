import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyCmtJrXGqi9B7ZvD-bHXHCv-ESJ6GBOQWM",
  authDomain: "scangame-e511f.firebaseapp.com",
  projectId: "scangame-e511f",
  storageBucket: "scangame-e511f.firebasestorage.app",
  messagingSenderId: "1056981866859",
  appId: "1:1056981866859:web:686c0264eabaf00632942e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
