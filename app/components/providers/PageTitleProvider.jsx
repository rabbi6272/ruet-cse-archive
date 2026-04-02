"use client";
import { useEffect, useState } from "react";
import { useNotificationCount } from "@/lib/useNotificationCount";
import AuthUtils from "@/lib/auth-utils-secure";

export function PageTitleProvider({ children }) {
  const [userRoll, setUserRoll] = useState(null);

  useEffect(() => {
    // Get user data from secure storage
    if (AuthUtils.isAuthenticated()) {
      try {
        const userRoll = AuthUtils.getUserRoll();
        setUserRoll(userRoll);
      } catch (error) {
        console.error("Error getting user data:", error);
        setUserRoll(null);
      }
    }
  }, []);

  // This will handle page title updates (no sound, only page title)
  useNotificationCount(userRoll, false, true);

  return <>{children}</>;
}
