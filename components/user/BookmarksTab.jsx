"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomContextMenu } from "@/components/ui/CustomContextMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBookmark, 
  faFolder, 
  faFile, 
  faExternalLinkAlt,
  faTrash,
  faEdit,
  faFolderOpen,
  faDownload
} from "@fortawesome/free-solid-svg-icons";
import { BookmarkManager } from "@/lib/bookmark-utils";
import { toast } from "react-hot-toast";

export function BookmarksTab({ className = "" }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, target: null });
  const [selectedBookmarks, setSelectedBookmarks] = useState(new Set());

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const allBookmarks = BookmarkManager.getBookmarks();
    setBookmarks(allBookmarks);
  };

  const removeBookmark = (bookmark) => {
    BookmarkManager.removeBookmark(bookmark.id);
    setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
    setSelectedBookmarks(prev => {
      const newSet = new Set(prev);
      newSet.delete(bookmark.id);
      return newSet;
    });
    toast.success(`${bookmark.name} removed from bookmarks`);
  };

  const openInNewTab = (bookmark) => {
    const isFolder = bookmark.type === 'folder';
    const url = isFolder ? `/drive/${bookmark.id}` : `/drive/file/${bookmark.id}`;
    window.open(url, '_blank');
  };

  const copyLink = (bookmark) => {
    const isFolder = bookmark.type === 'folder';
    const url = `${window.location.origin}${isFolder ? `/drive/${bookmark.id}` : `/drive/file/${bookmark.id}`}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleContextMenu = (e, bookmark) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      target: bookmark
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0, target: null });
  };

  const getContextMenuItems = (bookmark) => {
    const isFolder = bookmark.type === 'folder';
    
    return [
      {
        label: 'Open',
        icon: faExternalLinkAlt,
        action: () => {
          const url = isFolder ? `/drive/${bookmark.id}` : `/drive/file/${bookmark.id}`;
          window.location.href = url;
        }
      },
      {
        label: 'Open in new tab',
        icon: faExternalLinkAlt,
        action: () => openInNewTab(bookmark)
      },
      { type: 'separator' },
      {
        label: 'Copy link',
        icon: faDownload,
        action: () => copyLink(bookmark)
      },
      { type: 'separator' },
      {
        label: 'Remove bookmark',
        icon: faTrash,
        danger: true,
        action: () => removeBookmark(bookmark)
      }
    ];
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

  const toggleSelectBookmark = (bookmarkId) => {
    setSelectedBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  };

  const removeSelectedBookmarks = () => {
    if (selectedBookmarks.size === 0) return;
    
    const count = selectedBookmarks.size;
    selectedBookmarks.forEach(bookmarkId => {
      BookmarkManager.removeBookmark(bookmarkId);
    });
    
    setBookmarks(prev => prev.filter(b => !selectedBookmarks.has(b.id)));
    setSelectedBookmarks(new Set());
    toast.success(`${count} bookmark${count > 1 ? 's' : ''} removed`);
  };

  const selectAllBookmarks = () => {
    if (selectedBookmarks.size === bookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(bookmarks.map(b => b.id)));
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className={`text-center py-16 px-3 ${className}`}>
        <div className="text-6xl mb-4">🔖</div>
        <p className="text-gray-500 mb-2">No bookmarks yet</p>
        <p className="text-sm text-gray-400 mb-4">Visit the drive page and bookmark folders and files for quick access</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/drive">
            Go to Drive
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with bulk actions */}
      <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Bookmarks ({bookmarks.length})
            </h3>
            {selectedBookmarks.size > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedBookmarks.size} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {bookmarks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllBookmarks}
                className="text-xs"
              >
                {selectedBookmarks.size === bookmarks.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
            {selectedBookmarks.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeSelectedBookmarks}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove Selected
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {bookmarks.map((bookmark) => {
          const iconConfig = getFileIcon(bookmark.mimeType);
          const isFolder = bookmark.type === 'folder';
          const href = isFolder ? `/drive/${bookmark.id}` : `/drive/file/${bookmark.id}`;
          const isSelected = selectedBookmarks.has(bookmark.id);
          
          return (
            <div
              key={bookmark.id}
              className={`px-3 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onContextMenu={(e) => handleContextMenu(e, bookmark)}
            >
              <div className="flex items-center gap-3">
                {/* Selection checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelectBookmark(bookmark.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                {/* Icon */}
                <div className="flex-shrink-0">
                  {isFolder ? (
                    <Image
                      src="/images/folder.svg"
                      alt="Folder"
                      width={24}
                      height={24}
                    />
                  ) : (
                    <FontAwesomeIcon 
                      icon={iconConfig.icon} 
                      className={`h-5 w-5 ${iconConfig.color}`}
                    />
                  )}
                </div>

                {/* Content */}
                <Link href={href} className="flex-1 min-w-0 group/link">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover/link:text-blue-600 truncate">
                        {bookmark.name}
                      </p>
                      {bookmark.originalFileName && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
                          📄 Contains: {bookmark.originalFileName}
                        </p>
                      )}
                      {bookmark.path && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          📁 {bookmark.path}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Added {new Date(bookmark.dateAdded).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {bookmark.isFileFolderBookmark ? 'File Folder' : isFolder ? 'Folder' : 'File'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openInNewTab(bookmark);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        title="Open in new tab"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      <CustomContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        target={contextMenu.target}
        items={contextMenu.target ? getContextMenuItems(contextMenu.target) : []}
        onClose={closeContextMenu}
      />
    </div>
  );
}