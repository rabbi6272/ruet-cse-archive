// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAppCheck } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";

const commentsConfig = {
  apiKey: "AIzaSyDwDAI1ZnSglcdnj-QZIi6AeKM2uykk7Is",
  authDomain: "cse-archive-comments.firebaseapp.com",
  databaseURL:
    "https://cse-archive-comments-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cse-archive-comments",
  storageBucket: "cse-archive-comments.firebasestorage.app",
  messagingSenderId: "300898904046",
  appId: "1:300898904046:web:e710b91c6a0e10e43810ff",
  measurementId: "G-YWMVW32FVK",
};

const commentsApp = initializeApp(commentsConfig, "comments");
// App Check initialization (client-side only)
// if (typeof window !== "undefined") {
//   initializeAppCheck(commentsApp, {
//     provider: new ReCaptchaV3Provider("625442"),
//     isTokenAutoRefreshEnabled: true,
//   });
// }
const commentsDB = getFirestore(commentsApp);

export { commentsDB };
