"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBookmark, 
  faFolder, 
  faFile, 
  faTimes,
  faFolderOpen,
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { BookmarkManager } from "@/lib/bookmark-utils";
import { toast } from "react-hot-toast";

export function BookmarkPopup() {
  const [bookmarks, setBookmarks] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    if (mimeType.includes("pdf")) {
      return { icon: faFile, color: "text-red-500" };
    }
    return { icon: faFile, color: "text-gray-500" };
  };

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 5);

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
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {bookmarks.length}
          </Badge>
        )}
      </Button>

      {/* Popup Content */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto z-50 shadow-lg"
        >
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FontAwesomeIcon icon={faBookmark} className="h-5 w-5 text-yellow-500" />
                  Bookmarks ({bookmarks.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1 h-8 w-8"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faFolderOpen} className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No bookmarks yet</p>
                  <p className="text-xs mt-1">Visit the drive page to bookmark folders and files</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {displayedBookmarks.map((bookmark) => {
                      const iconConfig = getFileIcon(bookmark.mimeType);
                      const isFolder = bookmark.type === 'folder';
                      const href = isFolder ? `/drive/${bookmark.id}` : `/drive/file/${bookmark.id}`;
                      
                      return (
                        <div
                          key={bookmark.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                        >
                          <Link 
                            href={href} 
                            className="flex items-center gap-3 flex-1 min-w-0"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="flex-shrink-0">
                              {isFolder ? (
                                <Image
                                  src="/images/folder.svg"
                                  alt="Folder"
                                  width={20}
                                  height={20}
                                />
                              ) : (
                                <FontAwesomeIcon 
                                  icon={iconConfig.icon} 
                                  className={`h-4 w-4 ${iconConfig.color}`}
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {bookmark.name}
                              </p>
                              {bookmark.path && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {bookmark.path}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs ml-2">
                              {isFolder ? 'Folder' : 'File'}
                            </Badge>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              removeBookmark(bookmark.id, bookmark.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 ml-2"
                          >
                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {bookmarks.length > 5 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="w-full text-xs"
                      >
                        {showAll ? "Show Less" : `Show All (${bookmarks.length})`}
                      </Button>
                    </div>
                  )}
                  
                  {bookmarks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to clear all bookmarks?')) {
                            BookmarkManager.clearBookmarks();
                            setBookmarks([]);
                            toast.success('All bookmarks cleared');
                          }
                        }}
                        className="w-full text-xs text-red-500 hover:text-red-700"
                      >
                        Clear All Bookmarks
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}