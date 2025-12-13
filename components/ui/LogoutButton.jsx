"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOut } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";
import AuthUtils from "@/lib/auth-utils-secure";
import toast from "react-hot-toast";

const LogoutButton = ({ 
  className = "", 
  variant = "default", 
  showIcon = true, 
  children,
  size = "default" 
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

  // Map custom variants to shadcn button variants
  const getButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "destructive";
      case "outline":
        return "outline";
      case "ghost":
        return "ghost";
      case "minimal":
        return "ghost";
      default:
        return "secondary";
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={getButtonVariant()}
      size={size}
      className={className}
      title="Logout"
    >
      {showIcon && (
        <FontAwesomeIcon icon={faSignOut} className="h-4 w-4 mr-2" />
      )}
      {children || "Logout"}
    </Button>
  );
};

export default LogoutButton;
