"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as faBookmarkSolid } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as faBookmarkRegular } from "@fortawesome/free-regular-svg-icons";
import { BookmarkManager } from "@/lib/bookmark-utils";
import { toast } from "react-hot-toast";

export function BookmarkButton({ item, className = "", size = "sm", showText = false }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // For files, check if their parent folder is bookmarked
    if (item.type === 'file') {
      const currentPath = window.location.pathname;
      const folderMatch = currentPath.match(/\/drive\/([^\/]+)/);
      const currentFolderId = folderMatch ? folderMatch[1] : null;
      setIsBookmarked(BookmarkManager.isBookmarked(item.id, 'file', currentFolderId));
    } else {
      setIsBookmarked(BookmarkManager.isBookmarked(item.id, 'folder'));
    }
  }, [item.id, item.type]);

  const handleToggleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      let wasBookmarked;
      let bookmarkItem = { ...item };
      
      if (item.type === 'file') {
        // Extract folder ID from the current URL
        const currentPath = window.location.pathname;
        const folderMatch = currentPath.match(/\/drive\/([^\/]+)/);
        
        if (folderMatch) {
          const currentFolderId = folderMatch[1];
          
          // Check if folder is already bookmarked
          const isFolderBookmarked = BookmarkManager.isBookmarked(currentFolderId, 'folder');
          
          if (isFolderBookmarked) {
            // Remove folder bookmark
            BookmarkManager.removeBookmark(currentFolderId);
            wasBookmarked = false;
            toast.success(`Folder bookmark removed`);
          } else {
            // Add folder bookmark
            bookmarkItem = {
              ...item,
              name: `📁 Folder containing "${item.name}"`,
              type: 'folder',
              id: currentFolderId,
              mimeType: 'application/vnd.google-apps.folder',
              originalFileName: item.name,
              isFileFolderBookmark: true
            };
            BookmarkManager.addBookmark(bookmarkItem);
            wasBookmarked = true;
            toast.success(`Folder containing "${item.name}" bookmarked!`);
          }
        } else {
          throw new Error('Could not determine folder location');
        }
      } else {
        // Handle folder bookmarks normally
        wasBookmarked = BookmarkManager.toggleBookmark(bookmarkItem);
        
        if (wasBookmarked) {
          toast.success(`${item.name} bookmarked!`);
        } else {
          toast.success(`${item.name} removed from bookmarks`);
        }
      }
      
      setIsBookmarked(wasBookmarked);
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={`text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 ${className}`}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <FontAwesomeIcon
        icon={isBookmarked ? faBookmarkSolid : faBookmarkRegular}
        className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showText && (
        <span className="ml-1 text-xs">
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </span>
      )}
    </Button>
  );
}