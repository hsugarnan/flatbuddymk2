import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, setPersistence, indexedDBLocalPersistence, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // Import Platform from react-native
import { getMessaging } from 'firebase/messaging'; // Import Firebase Messaging

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};

// Initialize Firebase app
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
let auth;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Use React Native persistence for mobile platforms
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
} else {
    // Use IndexedDB persistence for web
    auth = getAuth(app);
    setPersistence(auth, indexedDBLocalPersistence);
}

// Initialize Firestore
const firestore = getFirestore(app);



export { app, auth, firestore };
