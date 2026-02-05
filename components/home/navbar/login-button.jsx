"use client";

import { NotificationBadge } from "@/components/ui/NotificationBadge";
import AuthUtils from "@/lib/auth-utils-secure";
import { useNotificationCount } from "@/lib/useNotificationCount";
import Link from "next/link";
import { useEffect, useState } from "react";

export function LoginButton() {
  const [userData, setUserData] = useState(null);
  const [userRoll, setUserRoll] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      if (AuthUtils.isAuthenticated()) {
        const authUserData = AuthUtils.getUserData();
        if (authUserData) {
          setUserData(authUserData);
          setUserRoll(authUserData.roll);
        } else {
          setUserData(null);
          setUserRoll(null);
        }
      } else {
        setUserData(null);
        setUserRoll(null);
      }
    };

    checkAuth();

    // Check authentication periodically in case user logs out in another tab
    const authCheckInterval = setInterval(checkAuth, 30000); // Check every 30 seconds

    return () => clearInterval(authCheckInterval);
  }, []);

  const { unreadCount, isLoading, error } = useNotificationCount(
    userRoll,
    true,
    true
  );

  if (userData) {
    return (
      <Link
        href="/user/dashboard"
        className="relative text-center bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300"
      >
        <ShinyText text="Dashboard" speed={2.5} className="text-gray-300" />
        {!isLoading && !error && <NotificationBadge count={unreadCount} />}
      </Link>
    );
  } else {
    return (
      <Link
        href="/user/login"
        className="text-center bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300"
      >
        <ShinyText text="Login" speed={2.5} className="text-gray-300" />
      </Link>
    );
  }
}

const ShinyText = ({ text, disabled = false, speed = 5, className = "" }) => {
  const animationDuration = `${speed}s`;

  return (
    <div
      className={`shiny-text ${disabled ? "disabled" : ""} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </div>
  );
};

export default ShinyText;
