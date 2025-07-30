"use client";
import { useEffect, useState } from "react";
import { useNotificationCount } from "@/lib/useNotificationCount";

export function PageTitleProvider({ children }) {
  const [userRoll, setUserRoll] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUserRoll(parsedUser.roll);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUserRoll(null);
      }
    }
  }, []);

  // This will handle page title updates (no sound, only page title)
  useNotificationCount(userRoll, false, true);

  return <>{children}</>;
}
