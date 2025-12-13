import Link from "next/link";
import Image from "next/image";

import { ibmPlexSans } from "@/app/ui/fonts";

import { MobileNavbarLinks } from "./mobile-navbar-links";
import { DesktopNavbarLinks } from "./desktop-navbar-links";

export function Navbar({ scrolled }) {
  return (
    <nav
      className={`${ibmPlexSans.className} w-full z-50 sticky top-3`}
    >
      <div className={`max-w-3xl mx-auto px-3 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-gray-200/30 dark:border-gray-700/30"
          : "bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm border border-gray-200/10 dark:border-gray-700/10"
      } rounded-full`}>
        <div className="flex items-center justify-between h-[48px] px-2">
          {/* <!-- Logo  --> */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src={"/images/logo.png"}
                priority
                alt="logo"
                height={42}
                width={42}
                className="object-contain"
              />
            </Link>
          </div>
          <DesktopNavbarLinks />
          <MobileNavbarLinks />
        </div>
      </div>
    </nav>
  );
}
