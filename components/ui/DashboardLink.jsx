"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { NotificationBadge } from "@/components/ui/NotificationBadge";

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
    const Data = localStorage.getItem("user");
    setUserData(Data);

    if (Data) {
      try {
        const parsedUser = JSON.parse(Data);
        setUserRoll(parsedUser.roll);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUserRoll(null);
      }
    } else {
      setUserRoll(null);
    }
  }, []);

  const { unreadCount, isLoading, error } = useNotificationCount(
    userRoll,
    playSound,
    updatePageTitle
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
