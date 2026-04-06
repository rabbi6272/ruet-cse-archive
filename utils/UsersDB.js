import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { ReCaptchaV3Provider, initializeAppCheck } from "firebase/app-check";

const USER_STORAGE_CONFIG = {
  apiKey: "AIzaSyCxod-eup82Oy_Od04YLHs7iOQdFGBmEHU",
  authDomain: "ruet-cse-24.firebaseapp.com",
  projectId: "ruet-cse-24",
  storageBucket: "ruet-cse-24.firebasestorage.app",
  databaseURL: "https://ruet-cse-24-default-rtdb.firebaseio.com",
  messagingSenderId: "45659772253",
  appId: "1:45659772253:web:963ee9de7794ee482d84b4",
  measurementId: "G-B8107S52H7",
};

//6LcO7aYsAAAAAP-IPs5gALP0XxwlG-KqgLUsgb_k
//recaptcha site key

const UsersApp = initializeApp(USER_STORAGE_CONFIG, "UsersApp");
const UsersDB = getFirestore(UsersApp);

initializeAppCheck(UsersApp, {
  provider: new ReCaptchaV3Provider("6LcO7aYsAAAAAP-IPs5gALP0XxwlG-KqgLUsgb_k"),
});

const USERS_COLLECTION = "users";

export { UsersDB, USERS_COLLECTION };
