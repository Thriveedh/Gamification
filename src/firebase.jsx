import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBtaUJ-6c8rtiD1977E-1bRKh0w1zcAfoc",
  authDomain: "gamification-114bc.firebaseapp.com",
  projectId: "gamification-114bc",
  storageBucket: "gamification-114bc.appspot.com",
  messagingSenderId: "582782868298",
  appId: "1:582782868298:web:46a0147adfd2d31a0fbfb3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };