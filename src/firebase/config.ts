import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD-78GjYq9_U0FAnXhEBoHGpE5BcPViG7o",
    authDomain: "myvideotranscriber.firebaseapp.com",
    projectId: "myvideotranscriber",
    storageBucket: "myvideotranscriber.firebasestorage.app",
    messagingSenderId: "169734295799",
    appId: "1:169734295799:web:02552fdb57330234ef83f2",
    measurementId: "G-1RGJ4D7SLG"
  };
  
  
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const storage = getStorage(app);
  export const storageBucket = firebaseConfig.storageBucket;
  export const db = getFirestore(app);