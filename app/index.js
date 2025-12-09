import { StyleSheet, Text, View } from "react-native";
import WelcomeScreen from "../welcome/WelcomeScreen"; 
import AppNavigator from "./AppNavigator";
import registerNNPushToken from 'native-notify';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};




const App = () => {
  return <AppNavigator />;
};

export default App;


// import { registerRootComponent } from 'expo'; // This handles app registration and life cycle
// import App from './App'; // Adjust the path if App.js is in a different location

// registerRootComponent(App);
