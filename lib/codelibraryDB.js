// lib/firebase-codelibrary.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const codelibraryConfig = {
  apiKey: "AIzaSyDcvagoN3Uv6PSTuXQg5uztf2tdiXl--dc",
  authDomain: "cse-archive-codes.firebaseapp.com",
  databaseURL: "https://cse-archive-codes-default-rtdb.firebaseio.com",
  projectId: "cse-archive-codes",
  storageBucket: "cse-archive-codes.firebasestorage.app",
  messagingSenderId: "15084195695",
  appId: "1:15084195695:web:21fad2e1a180645a79e29a",
  measurementId: "G-GMXJ26J8ET",
};

const codelibraryApp = initializeApp(codelibraryConfig, "codelibrary");

// App Check initialization (client-side only)
if (typeof window !== "undefined") {
  initializeAppCheck(codelibraryApp, {
    provider: new ReCaptchaV3Provider("625442"),
    isTokenAutoRefreshEnabled: true,
  });
}

const codelibraryDb = getDatabase(codelibraryApp);

export { codelibraryDb };
