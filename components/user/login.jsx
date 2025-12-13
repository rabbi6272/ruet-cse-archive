"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { users } from "@/db/students_info";
import { secureStorage } from "@/lib/secure-storage";
import AuthUtils from "@/lib/auth-utils-secure";
import { toast } from "react-hot-toast";

export function LoginForm() {
  const router = useRouter();

  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    if (AuthUtils.isAuthenticated()) {
      router.push("/user/dashboard");
    }
  }, [router]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = users.find((user) => user.roll === rollNumber);

      // Check if user exists
      if (!user) {
        setError("User not found");
        setIsLoading(false);
        toast.error("User not found");
        return;
      }

      // Check password
      if (user.password !== password) {
        setError("Invalid password");
        setIsLoading(false);
        toast.error("Invalid password");
        return;
      }

      // Successful login
      toast.success("Login successful!");
      setError("");

      // Set secure localStorage with 24-hour expiration
      const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      const userData = {
        roll: user.roll,
        name: user.name,
        expiry: expiryTime,
      };

      // Store data securely using encryption instead of plain text
      const success = secureStorage.setSecureUserData(userData);

      if (!success) {
        toast.error("Failed to secure user data");
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard after successful login
      router.push("/user/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url(/images/login-bg.jpg)] bg-center bg-cover flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background/95 backdrop-blur-lg border-border/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center tracking-wide">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="text-sm font-medium">
                Roll Number
              </Label>
              <Input
                type="text"
                id="rollNumber"
                placeholder="2403XXX"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="rounded-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-full pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
