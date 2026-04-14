import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOmxCviU0bU1O2ldC9x1ssw2SaESVUKEc",
  authDomain: "jigirikart.firebaseapp.com",
  projectId: "jigirikart",
  storageBucket: "jigirikart.firebasestorage.app",
  messagingSenderId: "233302280795",
  appId: "1:233302280795:web:59e17e3b4d8a96d1a28d7e",
  measurementId: "G-6BT6LS7HM4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();