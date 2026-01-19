import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, setPersistence, indexedDBLocalPersistence, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};

let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
} else {
    auth = getAuth(app);
    setPersistence(auth, indexedDBLocalPersistence);
}

const firestore = getFirestore(app);

// Initialize messaging for native platforms
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    getMessaging(app);
  } catch (error) {
    console.warn('Messaging not available:', error);
  }
}

export { app, auth, firestore };