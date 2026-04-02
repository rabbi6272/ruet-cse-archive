"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import FirebaseAuthService from "@/lib/firebase-auth-service";
import AuthUtils from "@/lib/auth-utils-secure";

import { UsersDB, USERS_COLLECTION } from "@/utils/UsersDB";
import { query, collection, where, getDocs, limit } from "firebase/firestore";

import { toast } from "react-hot-toast";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (AuthUtils.isAuthenticated()) {
      router.push("/user/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let userRecord = null;
      const normalizedEmail = email.trim().toLowerCase();
      const usersRef = collection(UsersDB, USERS_COLLECTION);
      const emailQuery = query(
        usersRef,
        where("email", "==", normalizedEmail),
        limit(1),
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        userRecord = {
          userId: emailSnapshot.docs[0].id,
          ...emailSnapshot.docs[0].data(),
        };
      }

      if (!userRecord) {
        toast.error("User not found");
        setIsLoading(false);
        return;
      }

      if (String(userRecord.pincode || "") !== password) {
        toast.error("Invalid password");
        setIsLoading(false);
        return;
      }

      const sessionStored = AuthUtils.setUserData({
        email: userRecord.email,
        roll: userRecord.roll,
        name: userRecord.fullName,
        profilePictureUrl: userRecord.profilePicture.url,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      });

      if (!sessionStored) {
        await FirebaseAuthService.signOut();
        toast.error("Failed to store user session");
        setIsLoading(false);
        return;
      }

      toast.success("Login successful!");
      router.push("/user/dashboard");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-70px)] overflow-hidden ">
      <div className="bg-white/60 dark:bg-[#071a26f1]/60 border border-gray-300 dark:border-gray-700 p-5 lg:p-8 rounded-xl w-[95%] lg:max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-700 dark:text-gray-300 tracking-wide mb-3 lg:mb-4">
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="pl-4 block text-sm font-medium text-gray-600 dark:text-gray-200"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="student@ruet.ac.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 text-gray-600 dark:text-gray-200 rounded-full shadow focus:outline-none focus:border-blue-500 transition-colors duration-200"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="pl-4 block text-sm font-medium text-gray-600 dark:text-gray-200"
            >
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 text-gray-600 dark:text-gray-200 rounded-full shadow focus:outline-none focus:border-blue-500 transition-colors duration-200 relative"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-[50%] right-4 text-sm transform -translate-y-[30%] text-gray-600 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                {showPassword ? (
                  <i class="fa-solid fa-eye-slash h-5 w-5"></i>
                ) : (
                  <i class="fa-solid fa-eye h-5 w-5"></i>
                )}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-200 my-2 pl-2">
            Don't have an account?{" "}
            <Link
              href="https://students.ruetcsearchive.app/profiles/create"
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              Register here
            </Link>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 mt-2 rounded-full hover:bg-blue-700 focus:outline-none active:scale-95 disabled:bg-blue-300 transition-colors duration-200"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
