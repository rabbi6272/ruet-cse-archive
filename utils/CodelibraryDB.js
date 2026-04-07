// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { ReCaptchaV3Provider, initializeAppCheck } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCR2j1A5Agj4eFA2SphWPzStu4FAh2c70Q",
  authDomain: "cse-archive-codelibrary.firebaseapp.com",
  projectId: "cse-archive-codelibrary",
  storageBucket: "cse-archive-codelibrary.firebasestorage.app",
  messagingSenderId: "350611498635",
  appId: "1:350611498635:web:aa8ed6a38eef6acefa568e",
  measurementId: "G-V2WNW4XG8N",
};

//6LdIZ6YsAAAAAGs1frbDxpApqgsSUALGCF5gTA0u
//recaptcha site key

// Initialize Firebase
const CodelibraryApp = initializeApp(firebaseConfig, "codelibrary");
const CodelibraryDB = getFirestore(CodelibraryApp);

if (typeof window !== "undefined") {
  initializeAppCheck(CodelibraryApp, {
    provider: new ReCaptchaV3Provider(
      "6LdIZ6YsAAAAAGs1frbDxpApqgsSUALGCF5gTA0u",
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

const COLLECTION = "codelibrary";

export { CodelibraryDB, COLLECTION };
