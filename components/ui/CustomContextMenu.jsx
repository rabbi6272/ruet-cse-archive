"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faTrash, 
  faFolder, 
  faExternalLinkAlt,
  faDownload,
  faEye,
  faCopy
} from "@fortawesome/free-solid-svg-icons";

export function CustomContextMenu({ 
  isOpen, 
  x, 
  y, 
  onClose, 
  items = [],
  target = null 
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let adjustedX = x;
      let adjustedY = y;

      // Adjust horizontal position
      if (x + rect.width > viewport.width) {
        adjustedX = viewport.width - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewport.height) {
        adjustedY = viewport.height - rect.height - 10;
      }

      menu.style.left = `${Math.max(10, adjustedX)}px`;
      menu.style.top = `${Math.max(10, adjustedY)}px`;
    }
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    item.action(target);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-[180px]"
        style={{ left: x, top: y }}
      >
        {items.map((item, index) => (
          <div key={index}>
            {item.type === 'separator' ? (
              <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            ) : (
              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`
                  w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors
                  ${item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {item.icon && (
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                )}
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-xs text-gray-400">{item.shortcut}</span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}