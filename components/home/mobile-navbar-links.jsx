"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { inter } from "@/app/ui/fonts";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { NotificationBadge } from "@/components/ui/NotificationBadge";

const mobileNavItems = [
  { label: "Resources", href: "/resources" },
  { label: "Book shelf", href: "/shelf" },
  { label: "Code Library", href: "/codelibrary" },
  { label: "Global Ruet", href: "/alumni" },
  {
    label: "Contact & Help",
    subItems: [
      { name: "Get Help", href: "/user/help" },
      { name: "Browse Doubts", href: "/all/doubts" },
      {
        name: "Official Website",
        href: "https://www.ruet.ac.bd/",
        target: "_blank",
      },
      { name: "Facebook Page", href: "/contact/fb1" },
      { name: "Contributors", href: "/contact/developers" },
    ],
  },
  {
    label: "Apps",
    subItems: [
      {
        name: "Coming Soon",
        href: "#",
        target: "_blank",
      },
    ],
  },
];

//
export function MobileNavbarLinks() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navRef = useRef();
  const buttonRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        navRef.current &&
        !navRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
        setIsNavOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropdown = (index) => {
    setOpenDropdown((prev) => (prev === index ? null : index));
  };

  return (
    <div className={`${inter.className} tracking-wide block lg:hidden`}>
      <button ref={buttonRef} onClick={() => setIsNavOpen(!isNavOpen)}>
        <i className="fas fa-bars-staggered text-gray-800 dark:text-gray-200 text-2xl cursor-pointer p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition duration-500"></i>
      </button>

      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.5,
            }}
            ref={navRef}
            className="fixed top-0 right-0 w-full h-full bg-white dark:bg-[#071a26] z-999999999 p-6 overflow-y-auto"
          >
            {/* Header and Menu */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Menu
              </h3>
              <button onClick={() => setIsNavOpen(!isNavOpen)}>
                <i className="fas fa-xmark text-gray-600 dark:text-gray-100 text-xl cursor-pointer"></i>
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col space-y-2">
              {mobileNavItems.map((item, index) => (
                <div key={item.label} className="nav-item relative py-1">
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(index)}
                        className="w-full text-left text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-all duration-500 flex items-center justify-between"
                      >
                        {item.label}
                        <i className="fas fa-chevron-down ml-2 text-xs"></i>
                      </button>
                      <AnimatePresence>
                        {openDropdown === index && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="pl-4"
                          >
                            {item.subItems.map((sub) =>
                              sub.target === "_blank" ? (
                                <a
                                  key={sub.name}
                                  href={sub.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setIsNavOpen(!isNavOpen)}
                                  className="block w-full px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
                                >
                                  {sub.name}
                                </a>
                              ) : (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  onClick={() => setIsNavOpen(!isNavOpen)}
                                  className="block w-full px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
                                >
                                  {sub.name}
                                </Link>
                              )
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsNavOpen(!isNavOpen)}
                      className="block text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-all duration-500"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Login Button */}
            <div className="mt-8" onClick={() => setIsNavOpen(!isNavOpen)}>
              <LoginButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
