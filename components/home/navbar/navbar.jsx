import Link from "next/link";
import Image from "next/image";

import { inter } from "@/app/ui/fonts";

import { LoginButton, MobileNavbarLinks } from "./mobile-navbar-links";

export function Navbar() {
  return (
    <nav
      className={`${inter.className} bg-[#ffffff]/75 dark:bg-[#071a26]/75 backdrop-blur-md shadow-lg border-b border-gray-200/20 dark:border-gray-700/20 font-normal text-md navbar  sticky top-0 w-full z-50`}
    >
      <div className="w-full mx-auto px-3 lg:px-10 flex items-center justify-between h-[70px]">
        {/* <!-- Logo  --> */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={"/images/logo.png"}
              priority
              alt="logo"
              height={80}
              width={80}
              className="object-contain"
            />
          </Link>
        </div>
        <DesktopNavbarLinks />
        <MobileNavbarLinks />
      </div>
    </nav>
  );
}

function DesktopNavbarLinks() {
  return (
    <div className={`${inter.className} desktop-menu hidden lg:block`}>
      <div className="flex items-baseline space-x-1 text-gray-700 dark:text-gray-200">
        {/* <!-- Nav Item 1 --> */}
        <div className="nav-item relative">
          <Link
            href="/resources"
            className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-md text-sm font-medium flex items-center transition-all duration-500"
          >
            Resources
          </Link>
        </div>

        {/* <!-- Nav Item 2 --> */}
        <div className="nav-item relative">
          <Link
            href="/shelf"
            className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-md text-sm font-medium flex items-center transition-all duration-500"
          >
            Book Shelf
          </Link>
        </div>

        {/* <!-- Nav Item 3 --> */}
        <div className="nav-item relative">
          <Link
            href="/codelibrary"
            className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-md text-sm font-medium flex items-center transition-all duration-500"
          >
            Code Library
          </Link>
        </div>

        {/* <!-- Nav Item 4 --> */}
        <div className="nav-item relative">
          <Link
            href="/alumni"
            className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-md text-sm font-medium flex items-center transition-all duration-500"
          >
            Global Ruet
          </Link>
        </div>

        {/* <!-- Nav Item 5 --> */}
        <div className="nav-item relative">
          <button className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-md text-sm font-medium flex items-center transition-all duration-500">
            Contact & Help
            <i className="fas fa-chevron-down ml-1 text-xs"></i>
          </button>
          <div className="dropdown morphic-effect absolute left-0 mt-3 w-44 rounded-md shadow-lg bg-white dark:bg-[#071a26] z-50">
            <Link
              href="/contact&help/help"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
            >
              Get Help
            </Link>
            <Link
              href="/contact&help/doubts"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
            >
              Browse Doubts
            </Link>
            <Link
              href="/contact&help/statistics"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
            >
              Statistics
            </Link>
            <Link
              href="https://www.ruet.ac.bd/"
              target="_blank"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
            >
              Official Website
            </Link>
            <Link
              href=""
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
            >
              Facebook Page
            </Link>
            <Link
              href="/contact&help/developers"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600"
            >
              Contributors
            </Link>
          </div>
        </div>

        {/* <!-- Nav Item 6 --> */}
        <div className="nav-item relative">
          <button className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-md text-sm font-medium flex items-center transition-all duration-500">
            Apps
          </button>
        </div>

        {/* <!-- Nav Item 7 --> */}
        <LoginButton />
      </div>
    </div>
  );
}
