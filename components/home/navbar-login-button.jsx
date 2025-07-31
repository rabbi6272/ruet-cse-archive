"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { NotificationBadge } from "@/components/ui/NotificationBadge";

export function LoginButton() {
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
    true,
    true
  );

  if (userData) {
    return (
      <Link
        href="/user/dashboard"
        className="relative text-center text-gray-200 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-500"
      >
        Dashboard
        {!isLoading && !error && <NotificationBadge count={unreadCount} />}
      </Link>
    );
  } else {
    return (
      <Link
        href="/user/login"
        className="text-center text-gray-200 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-500"
      >
        Login
      </Link>
    );
  }
}
