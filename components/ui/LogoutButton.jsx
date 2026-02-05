"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthUtils from "@/lib/auth-utils-secure";
import toast from "react-hot-toast";

const LogoutButton = ({ 
  className = "", 
  variant = "default", 
  showIcon = true, 
  children 
}) => {
  const router = useRouter();

  const handleLogout = () => {
    try {
      const success = AuthUtils.logout();
      
      if (success) {
        toast.success("Logged out successfully!");
        // Redirect to login page
        router.push("/user/login");
      } else {
        toast.error("Error during logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600";
      case "outline":
        return "bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:border-red-400";
      case "ghost":
        return "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent";
      case "minimal":
        return "bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-none shadow-none hover:shadow-none";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white border-gray-500 hover:border-gray-600";
    }
  };

  const baseClasses = "px-4 py-2 rounded-lg border font-medium transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2";

  return (
    <button
      onClick={handleLogout}
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      title="Logout"
    >
      {showIcon && (
        <i className="fas fa-sign-out-alt"></i>
      )}
      {children || "Logout"}
    </button>
  );
};

export default LogoutButton;
