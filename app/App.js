// import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// import AppNavigator from './AppNavigator';
// import { initializeApp } from "firebase/app";


// const firebaseConfig = {
//   apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
//   authDomain: "flatbuddy-mk1.firebaseapp.com",
//   projectId: "flatbuddy-mk1",
//   storageBucket: "flatbuddy-mk1.appspot.com",
//   messagingSenderId: "369948891874",
//   appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
//   measurementId: "G-MTV0H8F1Y1"
// };
// const app = initializeApp(firebaseConfig);

// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });

// const App = () => {
//   // Initialize Firebase
  

//   return <AppNavigator />;
// };

// export default App;
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "./AppNavigator";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};

// Initialize Firebase only if it hasn't been initialized already
let app;
let auth;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApps()[0]; // Use the already initialized app
  auth = getAuth(app); // Get the existing Auth instance
}

const App = () => {
  return <AppNavigator />;
};

export default App;
