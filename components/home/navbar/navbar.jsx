import Link from "next/link";
import Image from "next/image";

import { inter } from "@/app/ui/fonts";

import { MobileNavbarLinks } from "./mobile-navbar-links";
import { DesktopNavbarLinks } from "./desktop-navbar-links";

export function Navbar({ scrolled }) {
  return (
    <nav
      className={`${
        inter.className
      } navbar top-0 w-full z-50 transition-colors duration-300 ${
        scrolled
          ? "sticky bg-white/90 dark:bg-[#071a26]/80 backdrop-blur-md shadow-lg border-b border-gray-200/20 dark:border-gray-700/20"
          : "static bg-transparent"
      }`}
    >
      <div className="w-full mx-auto px-3 md:px-5 lg:px-8 xl:px-10 flex items-center justify-between h-[70px]">
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
