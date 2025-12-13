"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

// Minimal client component only for interactive links with lazy toast loading
export function ResourceCardLinks({ links }) {
  const [firstLink, secondLink] = [...links];

  // Ensure firstLink and secondLink are arrays
  const firstLinkArray = Array.isArray(firstLink)
    ? firstLink
    : [firstLink].filter(Boolean);
  const secondLinkArray = Array.isArray(secondLink)
    ? secondLink
    : [secondLink].filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-2">
        {firstLinkArray?.map((link, index) => (
          <Button
            key={index}
            variant={link.url !== "" ? "default" : "secondary"}
            size="sm"
            className={`flex-1 h-8 text-xs font-medium ${
              link.url === "" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            asChild={link.url !== ""}
            onClick={(e) => {
              if (link.url === "") {
                e.preventDefault();
                toast.error("Link not ready yet!");
              }
            }}
            aria-label={`${link.label} ${
              link.url === "" ? "(coming soon)" : ""
            }`}
          >
            {link.url !== "" ? (
              <Link href={link.url}>{link.label}</Link>
            ) : (
              <span>{link.label}</span>
            )}
          </Button>
        ))}
      </div>

      <div className="flex justify-between gap-2">
        {secondLinkArray?.map((link, index) => (
          <Button
            key={index}
            variant={link.url !== "" ? "outline" : "secondary"}
            size="sm"
            className={`flex-1 h-8 text-xs font-medium ${
              link.url === "" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            asChild={link.url !== ""}
            onClick={(e) => {
              if (link.url === "") {
                e.preventDefault();
                toast.error("Link not ready yet!");
              }
            }}
            aria-label={`${link.label} ${
              link.url === "" ? "(coming soon)" : ""
            }`}
          >
            {link.url !== "" ? (
              <Link href={link.url}>{link.label}</Link>
            ) : (
              <span>{link.label}</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
