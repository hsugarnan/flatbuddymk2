import AppNavigator from "./AppNavigator";
import { app, auth, firestore } from "../config/firebase"; // Import from config instead

export default function App() {
  return <AppNavigator />;
}