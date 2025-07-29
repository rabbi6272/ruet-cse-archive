import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database"; // Realtime Database imports

const firebaseConfig = {
apiKey: "AIzaSyAov5QhTpQ_1svMOFgWsg3E8tRalKrbs2U",
  authDomain: "last-197cd.firebaseapp.com",
  databaseURL: "https://last-197cd-default-rtdb.firebaseio.com",
  projectId: "last-197cd",
  storageBucket: "last-197cd.appspot.com",
  messagingSenderId: "176790808601",
  appId: "1:176790808601:web:af5bbe0fee206d74b86288",
  measurementId: "G-JPSKNHEVJT"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); // Initialize Realtime Database
