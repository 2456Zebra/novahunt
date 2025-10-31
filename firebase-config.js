import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCa66RRIPgCu5uemwH8vIgQBdlVe5ejStM",
  authDomain: "novahunt-da390.firebaseapp.com",
  projectId: "novahunt-da390",
  storageBucket: "novahunt-da390.firebasestorage.app",
  messagingSenderId: "564769701763",
  appId: "1:564769701763:web:1b76daf5ac786f1d6100b6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
