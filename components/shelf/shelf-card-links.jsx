"use client";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

// Minimal client component only for interactive links with lazy toast loading
export function ShelfCardLinks({ links }) {
  return (
    <div className="flex gap-2">
      {links.map((link, index) => (
        <Button
          key={index}
          variant={link.url !== "" ? (index === 0 ? "default" : "outline") : "secondary"}
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
          aria-label={`${link.label} ${link.url === "" ? "(coming soon)" : ""}`}
        >
          {link.url !== "" ? (
            <Link href={link.url}>{link.label}</Link>
          ) : (
            <span>{link.label}</span>
          )}
        </Button>
      ))}
    </div>
  );
}
