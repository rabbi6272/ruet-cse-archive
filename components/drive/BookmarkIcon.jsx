"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBookmark, 
  faFolder, 
  faFile, 
  faTimes,
  faFolderOpen
} from "@fortawesome/free-solid-svg-icons";
import { BookmarkManager } from "@/lib/bookmark-utils";
import { toast } from "react-hot-toast";

export function BookmarkIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const loadBookmarks = () => {
    const allBookmarks = BookmarkManager.getBookmarks();
    setBookmarks(allBookmarks);
  };

  const removeBookmark = (itemId, itemName) => {
    BookmarkManager.removeBookmark(itemId);
    setBookmarks(prev => prev.filter(b => b.id !== itemId));
    toast.success(`${itemName} removed from bookmarks`);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes("folder")) {
      return { icon: faFolder, color: "text-blue-500" };
    }
    if (mimeType.includes("image/")) {
      return { icon: faFile, color: "text-cyan-500" };
    }
    if (mimeType.includes("video/")) {
      return { icon: faFile, color: "text-indigo-500" };
    }
    if (mimeType.includes("audio/")) {
      return { icon: faFile, color: "text-orange-500" };
    }
    if (mimeType.includes("pdf")) {
      return { icon: faFile, color: "text-red-500" };
    }
    if (mimeType.includes("document") || mimeType.includes("text")) {
      return { icon: faFile, color: "text-blue-500" };
    }
    if (mimeType.includes("spreadsheet")) {
      return { icon: faFile, color: "text-green-500" };
    }
    if (mimeType.includes("presentation")) {
      return { icon: faFile, color: "text-yellow-500" };
    }
    return { icon: faFile, color: "text-gray-500" };
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === "0") return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 10) / 10} ${sizes[i]}`;
  };

  const truncateText = (text, maxLength = 25) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="relative">
      {/* Bookmark Icon Button */}
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <FontAwesomeIcon icon={faBookmark} className="h-4 w-4" />
        {bookmarks.length > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-blue-500 text-white"
          >
            {bookmarks.length}
          </Badge>
        )}
      </Button>

      {/* Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute top-full right-0 mt-2 w-80 max-h-96 z-50 shadow-lg"
        >
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBookmark} className="h-4 w-4 text-blue-500" />
                  Bookmarks ({bookmarks.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faBookmark} className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No bookmarks yet</p>
                  <p className="text-xs mt-1">
                    Bookmark files and folders to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => {
                    const { icon, color } = getFileIcon(bookmark.mimeType);
                    return (
                      <div
                        key={bookmark.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Link
                          href={bookmark.path}
                          className="flex items-center gap-3 flex-1 min-w-0"
                          onClick={() => setIsOpen(false)}
                        >
                          <FontAwesomeIcon
                            icon={icon}
                            className={`h-4 w-4 flex-shrink-0 ${color}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {truncateText(bookmark.name)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {bookmark.mimeType.includes("folder") ? "Folder" : "File"}
                              </Badge>
                              {bookmark.size && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(bookmark.size)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBookmark(bookmark.id, bookmark.name)}
                          className="ml-2 h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}