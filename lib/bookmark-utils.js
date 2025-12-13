/**
 * Bookmark utility for managing user's bookmarked folders and files
 */

const BOOKMARK_STORAGE_KEY = 'drive_bookmarks';
const MAX_BOOKMARKS = 50; // Limit to prevent localStorage bloat

export class BookmarkManager {
  /**
   * Get all bookmarks from localStorage
   * @returns {Array} Array of bookmark objects
   */
  static getBookmarks() {
    try {
      if (typeof window === 'undefined') return [];
      const bookmarks = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }

  /**
   * Save bookmarks to localStorage
   * @param {Array} bookmarks - Array of bookmark objects
   */
  static saveBookmarks(bookmarks) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  /**
   * Add a bookmark
   * @param {Object} item - The item to bookmark
   * @param {string} item.id - Item ID
   * @param {string} item.name - Item name
   * @param {string} item.type - 'folder' or 'file'
   * @param {string} item.mimeType - MIME type
   * @param {string} item.path - Current path/breadcrumb
   */
  static addBookmark(item) {
    const bookmarks = this.getBookmarks();
    
    // Check if already bookmarked
    if (bookmarks.some(bookmark => bookmark.id === item.id)) {
      return false; // Already bookmarked
    }

    const newBookmark = {
      id: item.id,
      name: item.name,
      type: item.type,
      mimeType: item.mimeType,
      path: item.path || '',
      dateAdded: Date.now()
    };

    // Add to beginning of array
    bookmarks.unshift(newBookmark);

    // Keep only max bookmarks
    if (bookmarks.length > MAX_BOOKMARKS) {
      bookmarks.splice(MAX_BOOKMARKS);
    }

    this.saveBookmarks(bookmarks);
    return true;
  }

  /**
   * Remove a bookmark
   * @param {string} itemId - ID of the item to remove
   */
  static removeBookmark(itemId) {
    const bookmarks = this.getBookmarks();
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== itemId);
    this.saveBookmarks(filteredBookmarks);
    return filteredBookmarks.length !== bookmarks.length;
  }

  /**
   * Check if an item is bookmarked
   * For files, check if their parent folder is bookmarked
   * @param {string} itemId - ID of the item to check
   * @param {string} itemType - Type of item ('file' or 'folder')
   * @param {string} currentFolderId - Current folder ID (for files)
   * @returns {boolean}
   */
  static isBookmarked(itemId, itemType = 'folder', currentFolderId = null) {
    const bookmarks = this.getBookmarks();
    
    if (itemType === 'file' && currentFolderId) {
      // For files, check if the parent folder is bookmarked
      return bookmarks.some(bookmark => 
        bookmark.id === currentFolderId && bookmark.type === 'folder'
      );
    }
    
    // For folders, check direct bookmark
    return bookmarks.some(bookmark => bookmark.id === itemId);
  }

  /**
   * Toggle bookmark status
   * @param {Object} item - The item to toggle
   * @returns {boolean} - true if bookmarked, false if removed
   */
  static toggleBookmark(item) {
    if (this.isBookmarked(item.id)) {
      this.removeBookmark(item.id);
      return false;
    } else {
      this.addBookmark(item);
      return true;
    }
  }

  /**
   * Get bookmarks by type
   * @param {string} type - 'folder' or 'file'
   * @returns {Array}
   */
  static getBookmarksByType(type) {
    const bookmarks = this.getBookmarks();
    return bookmarks.filter(bookmark => bookmark.type === type);
  }

  /**
   * Clear all bookmarks
   */
  static clearBookmarks() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(BOOKMARK_STORAGE_KEY);
    }
  }

  /**
   * Get recently added bookmarks
   * @param {number} limit - Number of recent bookmarks to return
   * @returns {Array}
   */
  static getRecentBookmarks(limit = 10) {
    const bookmarks = this.getBookmarks();
    return bookmarks.slice(0, limit);
  }
}

export default BookmarkManager;