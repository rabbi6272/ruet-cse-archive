"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { users } from "@/lib/mino";

import toast, { Toaster } from "react-hot-toast";

export function LoginForm() {
  const router = useRouter();

  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      // Set localStorage with 24-hour expiration
      const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      localStorage.setItem(
        "user",
        JSON.stringify({
          roll: user.roll,
          name: user.name,
          expiry: expiryTime,
        })
      );

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
    <div className="flex items-center justify-center ">
      <Toaster />
      <div className="bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 p-5 lg:p-8 rounded-lg shadow-lg w-[95%] lg:max-w-md">
        <h2 className="text-3xl font-bold text-center tracking-wide mb-3 lg:mb-5">
          Login
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Roll Number */}
          <div className="mb-4">
            <label
              htmlFor="rollNumber"
              className="block text-sm font-medium  text-gray-800 dark:text-gray-200"
            >
              Roll Number
            </label>
            <input
              type="text"
              id="rollNumber"
              placeholder="2403XXX"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300  text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium  text-gray-800 dark:text-gray-200"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300  text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />

              {/* Toggle password visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5  "
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5  text-gray-800 dark:text-gray-200"
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
                    className="h-5 w-5  text-gray-800 dark:text-gray-200"
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
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors duration-300"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
