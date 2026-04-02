const USER_STORAGE_KEY = "user";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

class AuthUtils {
  static normalizeUserData(userData) {
    if (!userData || !userData.email || !userData.name || !userData.roll) {
      return null;
    }

    const expiry = Number(userData.expiry);
    return {
      email: String(userData.email),
      roll: String(userData.roll),
      name: String(userData.name),
      profilePictureUrl: String(userData.profilePictureUrl) || "",
      expiry:
        Number.isFinite(expiry) && expiry > 0
          ? expiry
          : Date.now() + SESSION_DURATION_MS,
    };
  }

  static getUserData() {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!storedUser) {
        return null;
      }

      const userData = this.normalizeUserData(JSON.parse(storedUser));
      if (!userData) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
      }

      if (Date.now() >= userData.expiry) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
      }

      return userData;
    } catch (error) {
      console.error("Failed to read user session:", error);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }

  static isAuthenticated() {
    return this.getUserData() !== null;
  }

  static getUserRoll() {
    const userData = this.getUserData();
    return userData ? userData.roll : null;
  }

  static getUserEmail() {
    const userData = this.getUserData();
    return userData ? userData.email : null;
  }

  static getUserName() {
    const userData = this.getUserData();
    return userData ? userData.name : null;
  }

  static getUserProfilePictureUrl() {
    const userData = this.getUserData();
    return userData ? userData.profilePictureUrl : null;
  }

  static isAdmin() {
    const userRoll = this.getUserRoll();
    return userRoll === "2403172" || userRoll === "2403142";
  }

  static setUserData(userData) {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const normalizedUser = this.normalizeUserData(userData);
      if (!normalizedUser) {
        return false;
      }

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
      return true;
    } catch (error) {
      console.error("Failed to store user session:", error);
      return false;
    }
  }

  static logout() {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("pikachu_chat_history");
      localStorage.removeItem("pikachu_message_quota");
      return true;
    } catch (error) {
      console.error("Failed to clear user session:", error);
      return false;
    }
  }

  static isSessionValid() {
    return this.isAuthenticated();
  }

  static refreshSession() {
    const userData = this.getUserData();
    if (!userData) {
      return false;
    }

    return this.setUserData({
      ...userData,
      expiry: Date.now() + SESSION_DURATION_MS,
    });
  }

  static getStorageInfo() {
    if (typeof window === "undefined") {
      return {
        error: "Server-side environment",
        isAuthenticated: false,
        sessionValid: false,
        userRoll: null,
        userEmail: null,
        storageKeys: [],
      };
    }

    const userData = this.getUserData();

    return {
      isAuthenticated: this.isAuthenticated(),
      sessionValid: this.isSessionValid(),
      userRoll: userData?.roll ?? null,
      userEmail: userData?.email ?? null,
      storageKeys: Object.keys(localStorage).filter(
        (key) => key === USER_STORAGE_KEY || key.startsWith("session_"),
      ),
    };
  }
}

export default AuthUtils;

export const {
  getUserData,
  isAuthenticated,
  getUserRoll,
  getUserEmail,
  getUserName,
  isAdmin,
  logout,
  isSessionValid,
  refreshSession,
  setUserData,
  getStorageInfo,
} = AuthUtils;
