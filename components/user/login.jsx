"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  // Mock data (since we can't access @/db/data.json in browser)
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
  //bg-[url(/images/login-bg.jpg)] bg-center bg-cover

  return (
    <div className="glass-card-container flex items-center justify-center w-full h-dvh overflow-hidden ">
      <div className="glass-card backdrop-blur-lg p-5 lg:p-8 rounded-xl w-[95%] lg:max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-300 tracking-wide mb-3 lg:mb-4">
          Login
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Roll Number */}
          <div className="mb-4">
            <label
              htmlFor="rollNumber"
              className="pl-4 block text-sm font-medium text-gray-200"
            >
              Roll Number
            </label>
            <input
              type="text"
              id="rollNumber"
              placeholder="2403XXX"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="mt-1 w-full px-3 py-2 border-2 border-gray-400 text-gray-200 rounded-full shadow-sm focus:outline-none focus:border-blue-500 transition-colors duration-300"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="pl-4 block text-sm font-medium text-gray-200"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border-2 border-gray-400 text-gray-200 rounded-full shadow-sm focus:outline-none focus:border-blue-500 transition-colors duration-300"
                required
              />

              {/* Toggle password visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm leading-5"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5 text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 mt-2 rounded-full hover:bg-blue-700 focus:outline-none active:scale-95 disabled:bg-blue-300 transition-colors duration-300"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
