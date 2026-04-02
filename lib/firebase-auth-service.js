import { ref, get, set } from "firebase/database";
import { firebaseAuth, db } from "./firebase";
import AuthUtils from "./auth-utils-secure";

class FirebaseAuthService {
  static isInitialized = false;

  static async initialize() {
    if (typeof window === "undefined") {
      return;
    }

    this.isInitialized = true;
    await this.ensureAuthRollBinding();
  }

  static async signInAnonymously() {
    const userCredential = await firebaseAuth.signInAnonymously();
    await this.ensureAuthRollBinding();
    return userCredential;
  }

  static async ensureAuthRollBinding() {
    try {
      const localUser = AuthUtils.getUserData();
      const firebaseUser = firebaseAuth.getCurrentUser();

      if (!localUser?.roll || !firebaseUser?.uid) {
        return false;
      }

      const roll = String(localUser.roll);
      const bindingRef = ref(db, `authRollBindings/${firebaseUser.uid}`);
      const snapshot = await get(bindingRef);

      if (snapshot.exists()) {
        const existingRoll = String(snapshot.val() || "");
        if (existingRoll !== roll) {
          console.warn("Auth roll binding mismatch detected", {
            uid: firebaseUser.uid,
            existingRoll,
            localRoll: roll,
          });
          return false;
        }
        return true;
      }

      await set(bindingRef, roll);
      return true;
    } catch (error) {
      console.error("Failed to ensure auth roll binding:", error);
      return false;
    }
  }

  static async signOut() {
    try {
      await firebaseAuth.signOut();
    } catch (error) {
      console.error("Firebase sign out failed:", error);
    } finally {
      AuthUtils.logout();
    }
  }

  static getCurrentUser() {
    const localUser = AuthUtils.getUserData();
    if (!localUser) {
      return null;
    }

    const firebaseUser = firebaseAuth.getCurrentUser();
    return {
      ...localUser,
      firebaseUid: firebaseUser?.uid ?? null,
      isFullyAuthenticated: Boolean(firebaseUser),
    };
  }

  static isFullyAuthenticated() {
    return (
      AuthUtils.isAuthenticated() && Boolean(firebaseAuth.getCurrentUser())
    );
  }

  static async validateSession() {
    if (!AuthUtils.isAuthenticated()) {
      await this.signOut();
      return false;
    }

    if (!this.isFullyAuthenticated()) {
      return false;
    }

    return this.ensureAuthRollBinding();
  }
}

export default FirebaseAuthService;
