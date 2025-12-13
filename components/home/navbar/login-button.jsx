"use client";

import { NotificationBadge } from "@/components/ui/NotificationBadge";
import { Button } from "@/components/ui/button";
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
      <div className="relative">
        <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/user/dashboard">
            <ShinyText text="Dashboard" speed={2.5} className="text-white" />
          </Link>
        </Button>
        {!isLoading && !error && <NotificationBadge count={unreadCount} />}
      </div>
    );
  } else {
    return (
      <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
        <Link href="/user/login">
          <ShinyText text="Login" speed={2.5} className="text-white" />
        </Link>
      </Button>
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
