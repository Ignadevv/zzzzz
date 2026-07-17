import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD9YpHYKFnUzUftKqWjEN7cGmaBV9XWlR8",
  authDomain: "dash-web-6b417.firebaseapp.com",
  projectId: "dash-web-6b417",
  storageBucket: "dash-web-6b417.firebasestorage.app",
  messagingSenderId: "1079798233732",
  appId: "1:1079798233732:web:52f2f3c45aaaacfd3b60d1",
  measurementId: "G-VQML6VLWSE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
