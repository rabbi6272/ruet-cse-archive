import { LoginButton } from "./login-button";
import Link from "next/link";
import { inter } from "@/app/ui/fonts";

export function DesktopNavbarLinks() {
  return (
    <div className={`${inter.className} desktop-menu hidden lg:block`}>
      <div className="flex items-baseline space-x-1 text-gray-700 dark:text-gray-200">
        {/* <!-- Nav Item 1 --> */}
        <div className="nav-item relative">
          <Link
            href="/resources"
            className="text-gray-700 dark:text-gray-200 hover:text-blue-500  hover:bg-gray-300 dark:hover:bg-transparent px-3.5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all duration-500"
          >
            Resources
          </Link>
        </div>

        {/* <!-- Nav Item 2 --> */}
        <div className="nav-item relative">
          <Link
            href="/shelf"
            className="text-gray-700 dark:text-gray-200 hover:text-blue-500  hover:bg-gray-300 dark:hover:bg-transparent px-3.5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all duration-500"
          >
            Book Shelf
          </Link>
        </div>

        {/* <!-- Nav Item 3 --> */}
        <div className="nav-item relative">
          <Link
            href="/codelibrary"
            className="text-gray-700 dark:text-gray-200 hover:text-blue-500  hover:bg-gray-300 dark:hover:bg-transparent px-3.5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all duration-500"
          >
            Code Library
          </Link>
        </div>

        {/* <!-- Nav Item 4 --> */}
        <div className="nav-item relative">
          <Link
            href="/alumni"
            className="text-gray-700 dark:text-gray-200 hover:text-blue-500  hover:bg-gray-300 dark:hover:bg-transparent px-3.5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all duration-500"
          >
            Global Ruet
          </Link>
        </div>

        {/* <!-- Nav Item 5 --> */}
        <div className="nav-item relative">
          <button className="text-gray-700 dark:text-gray-200 hover:text-blue-500  hover:bg-gray-300 dark:hover:bg-transparent px-3.5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all duration-500">
            Contact & Help
            <i className="fas fa-chevron-down ml-1 text-xs"></i>
          </button>
          <div className="dropdown bg-[#ffffff]/90 dark:bg-[#071a26]/90 backdrop-blur-lg shadow-lg absolute left-0 mt-4 py-1 w-44 rounded-lg z-50">
            <Link
              href="/contact&help/help"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#071a26]/90 hover:text-blue-600 dark:hover:text-blue-500 "
            >
              Get Help
            </Link>
            <Link
              href="/contact&help/doubts"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#071a26]/90 hover:text-blue-600 dark:hover:text-blue-500 "
            >
              Browse Doubts
            </Link>
            <Link
              href="/contact&help/statistics"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#071a26]/90 hover:text-blue-600 dark:hover:text-blue-500"
            >
              Statistics
            </Link>
            <Link
              href="https://www.ruet.ac.bd/"
              target="_blank"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#071a26]/90 hover:text-blue-600 dark:hover:text-blue-500"
            >
              Official Website
            </Link>
            <Link
              href="https://www.facebook.com/people/RUET-CSE-24/61574730479807/"
              target="_blank"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#071a26]/90 hover:text-blue-600 dark:hover:text-blue-500"
            >
              Facebook Page
            </Link>
            <Link
              href="/contact&help/developers"
              className="block px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#071a26]/90 hover:text-blue-600 dark:hover:text-blue-500"
            >
              Contributors
            </Link>
          </div>
        </div>

        {/* <!-- Nav Item 6 --> */}
        <div className="nav-item relative">
          <button className="text-gray-700 dark:text-gray-200 hover:text-blue-500 hover:bg-gray-300 dark:hover:bg-transparent px-3.5 py-2.5 rounded-full text-sm font-medium flex items-center transition-all duration-500">
            Apps
          </button>
        </div>

        {/* <!-- Nav Item 7 --> */}
        <LoginButton />
      </div>
    </div>
  );
}
