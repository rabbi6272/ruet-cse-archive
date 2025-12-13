"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NotificationBadge({ count, className = "", size = "sm" }) {
  if (!count || count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  // Size variants
  const sizeClasses = {
    xs: "min-w-[16px] h-4 text-[8px] -top-1 -right-1",
    sm: "min-w-[20px] h-5 text-[10px] -top-2 -right-2",
    md: "min-w-[24px] h-6 text-xs -top-2 -right-2",
  };

  return (
    <Badge 
      variant="destructive"
      className={cn(
        "absolute rounded-full flex items-center justify-center px-1 animate-pulse",
        sizeClasses[size],
        className
      )}
      style={{
        lineHeight: "1",
        zIndex: 10,
      }}
    >
      {displayCount}
    </Badge>
  );
}
