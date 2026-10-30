import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBrzTlB0RtRA1O78OmWzzs6jelMyVdwb0Q",
  authDomain: "jireh-pajir-cravings.firebaseapp.com",
  projectId: "jireh-pajir-cravings",
  storageBucket: "jireh-pajir-cravings.firebasestorage.app",
  messagingSenderId: "1025949650421",
  appId: "1:1025949650421:web:d64dea6db5493b3f6164bc",
  measurementId: "G-MKC4XHP3X0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);