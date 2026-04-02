"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { NotificationBadge } from "@/app/components/ui/NotificationBadge";
import AuthUtils from "@/lib/auth-utils-secure";

export function DashboardLink({
  className = "",
  badgeSize = "sm",
  showText = true,
  playSound = false,
  updatePageTitle = false,
  children,
}) {
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
    playSound,
    updatePageTitle,
  );

  if (!userData) {
    return null;
  }

  return (
    <Link href="/user/dashboard" className={`relative ${className}`}>
      {children ||
        (showText ? "Dashboard" : <i className="fas fa-tachometer-alt"></i>)}
      {!isLoading && !error && (
        <NotificationBadge count={unreadCount} size={badgeSize} />
      )}
    </Link>
  );
}
