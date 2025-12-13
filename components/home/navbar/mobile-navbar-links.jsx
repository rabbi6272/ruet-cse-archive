"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ibmPlexSans } from "@/app/ui/fonts";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import AuthUtils from "@/lib/auth-utils-secure";
import { LoginButton } from "./login-button";

const mobileNavItems = [
  { label: "Resources", href: "/resources" },
  { label: "Book shelf", href: "/shelf" },
  { label: "Code Library", href: "/codelibrary" },
  { label: "Apps", href: "/apps" },
  { label: "Contact", href: "/contact/developers" },
];

export function MobileNavbarLinks() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => pathname === href;

  const toggleDropdown = useCallback((index) => {
    setOpenDropdown((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className={`${ibmPlexSans.className} tracking-wide block lg:hidden`}>
      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="p-3">
            <FontAwesomeIcon 
              icon={faBars} 
              className="h-6 w-6 text-gray-800 dark:text-gray-200" 
            />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Menu
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col space-y-2 mt-6">
            {mobileNavItems.map((item, index) => (
              <div key={item.label} className="nav-item">
                {item.subItems ? (
                  <Collapsible 
                    open={openDropdown === index} 
                    onOpenChange={() => toggleDropdown(index)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-left text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {item.label}
                        <FontAwesomeIcon 
                          icon={faChevronDown} 
                          className={`h-3 w-3 transition-transform ${openDropdown === index ? 'rotate-180' : ''}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-1">
                      {item.subItems.map((sub) =>
                        sub.target === "_blank" ? (
                          <a
                            key={sub.name}
                            href={sub.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsNavOpen(false)}
                            className="block w-full px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 transition-colors"
                          >
                            {sub.name}
                          </a>
                        ) : (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setIsNavOpen(false)}
                            className="block w-full px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        )
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link
                      href={item.href}
                      onClick={() => setIsNavOpen(false)}
                      className={`transition-all ${
                        isActive(item.href)
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <ThemeToggle />
            </div>
            
            <div onClick={() => setIsNavOpen(false)}>
              <LoginButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
