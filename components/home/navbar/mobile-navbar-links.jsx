"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { inter } from "@/app/ui/fonts";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import AuthUtils from "@/lib/auth-utils-secure";
import { LoginButton } from "./login-button";

const mobileNavItems = [
  { label: "Resources", href: "/resources" },
  { label: "Book shelf", href: "/shelf" },
  { label: "Code Library", href: "/codelibrary" },
  { label: "Global Ruet", href: "/alumni" },
  {
    label: "Contact & Help",
    subItems: [
      
      {
        name: "Official Website",
        href: "https://www.ruet.ac.bd/",
        target: "_blank",
      },
      {
        name: "Facebook Page",
        href: "https://www.facebook.com/people/RUET-CSE-24/61574730479807/",
        target: "_blank",
      },
      { name: "Contributors", href: "/contact&help/developers" },
    ],
  },
  {
    label: "Apps",
    href: "/contact&help/#",
  },
];

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
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const toggleDropdown = useCallback((index) => {
    setOpenDropdown((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className={`${inter.className} tracking-wide block lg:hidden`}>
      <button ref={buttonRef} onClick={() => setIsNavOpen(!isNavOpen)}>
        <i className="fas fa-bars-staggered text-gray-800 dark:text-gray-200 text-2xl cursor-pointer p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition duration-500"></i>
      </button>

      {/* Add slide-in animation with proper enter/exit states */}
      <div
        ref={navRef}
        className={`fixed bg-white dark:bg-[#071a26] p-6 overflow-y-auto overflow-x-hidden transition-all duration-500 ease-out ${
          isNavOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible"
        }`}
        style={{
          position: "fixed",
          top: "0",
          right: "0",
          left: isNavOpen ? "0" : "100%",
          width: "100vw",
          height: "100vh",
          zIndex: 99999,
          maxHeight: "100vh",
          transform: isNavOpen ? "translateX(0)" : "translateX(100%)",
        }}
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
                  {/* Use CSS transitions instead of Framer Motion */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      openDropdown === index
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-4">
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
                    </div>
                  </div>
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
      </div>
    </div>
  );
}
