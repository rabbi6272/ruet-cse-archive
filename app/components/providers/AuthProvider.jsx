"use client";

import { createContext, useContext, useEffect, useState } from "react";
import FirebaseAuthService from "@/lib/firebase-auth-service";
import AuthUtils from "@/lib/auth-utils-secure";

// Create authentication context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

// Authentication Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        await FirebaseAuthService.initialize();

        const currentUser = AuthUtils.getUserData();
        setUser(currentUser);
        setIsAuthenticated(Boolean(currentUser));
      } catch (error) {
        console.error("Failed to initialize authentication:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const refreshFromStorage = () => {
      try {
        const currentUser = AuthUtils.getUserData();
        setUser(currentUser);
        setIsAuthenticated(Boolean(currentUser));
      } catch (error) {
        console.error("Session refresh error:", error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "user") {
        refreshFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const signOut = async () => {
    try {
      await FirebaseAuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const refreshAuth = async () => {
    try {
      await FirebaseAuthService.initialize();
      const currentUser = AuthUtils.getUserData();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Refresh auth error:", error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
