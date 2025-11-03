// src/firebase-client.js - sample Firebase init (replace placeholders)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE.firebaseapp.com',
  projectId: 'REPLACE',
  storageBucket: 'REPLACE.appspot.com',
  messagingSenderId: 'REPLACE',
  appId: 'REPLACE',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);