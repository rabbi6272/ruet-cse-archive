"use client";

import { LoginButton } from "./login-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ibmPlexSans } from "@/app/ui/fonts";

export function DesktopNavbarLinks() {
  const pathname = usePathname();
  
  const isActive = (path) => pathname === path;
  
  return (
    <div className={`${ibmPlexSans.className} desktop-menu hidden lg:block`}>
      <div className="flex items-baseline space-x-1 text-gray-700 dark:text-gray-200">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/resources"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive("/resources")
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-200 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Resources
          </Link>
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/shelf"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive("/shelf")
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-200 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Book Shelf
          </Link>
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/codelibrary"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive("/codelibrary")
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-200 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Code Library
          </Link>
        </Button>

        <Button variant="ghost" size="sm" className={`text-gray-700 dark:text-gray-200 hover:text-blue-500 px-3 py-1.5 rounded-full text-sm font-medium ${
          isActive("/contact/developers") ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""
        }`} asChild>
          <Link href="/contact/developers">
            Contact
          </Link>
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/apps"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive("/apps")
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-200 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Apps
          </Link>
        </Button>

        <ThemeToggle className="text-gray-700 dark:text-gray-200 hover:text-blue-500 px-3 py-1.5 rounded-full" />

        <LoginButton />
      </div>
    </div>
  );
}
