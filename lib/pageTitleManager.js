"use client";

class PageTitleManager {
  constructor() {
    this.originalTitle = null;
    this.isBlinking = false;
    this.blinkInterval = null;
    this.currentCount = 0;
  }

  // Initialize with the original page title
  init() {
    if (typeof document !== "undefined") {
      this.originalTitle = document.title;
    }
  }

  // Update page title with notification count
  updateTitle(count, isNewNotification = false) {
    if (typeof document === "undefined") return;

    // Initialize original title if not set
    if (!this.originalTitle) {
      this.originalTitle = document.title;
    }

    this.currentCount = count;

    // Stop any existing blinking
    this.stopBlinking();

    if (count > 0) {
      if (isNewNotification) {
        // Show "New Notification" for new notifications
        document.title = "New Notification";

        // Start blinking immediately for new notifications
        this.startNewNotificationBlinking();
      } else {
        // Set title with notification count
        const countText = count > 99 ? "99+" : count.toString();
        document.title = `(${countText}) ${this.originalTitle}`;

        // Start blinking if page is not visible
        if (document.hidden) {
          this.startBlinking(countText);
        }
      }
    } else {
      // Reset to original title
      document.title = this.originalTitle;
    }
  }

  // Handle new notification with special title
  showNewNotification(count) {
    this.updateTitle(count, true);
  }

  // Start blinking effect when page is not visible
  startBlinking(countText) {
    if (this.isBlinking) return;

    this.isBlinking = true;
    let showCount = true;

    this.blinkInterval = setInterval(() => {
      if (typeof document === "undefined") return;

      if (showCount) {
        document.title = `(${countText}) ${this.originalTitle}`;
      } else {
        document.title = `★ New Message! ★`;
      }
      showCount = !showCount;
    }, 1500); // Blink every 1.5 seconds
  }

  // Start special blinking for new notifications
  startNewNotificationBlinking() {
    if (this.isBlinking) return;

    this.isBlinking = true;
    let showNewNotification = true;

    this.blinkInterval = setInterval(() => {
      if (typeof document === "undefined") return;

      if (showNewNotification) {
        document.title = "New Notification";
      } else {
        const countText =
          this.currentCount > 99 ? "99+" : this.currentCount.toString();
        document.title = `(${countText}) ${this.originalTitle}`;
      }
      showNewNotification = !showNewNotification;
    }, 1000); // Faster blinking for new notifications (1 second)

    // After 5 seconds, switch to normal blinking pattern
    setTimeout(() => {
      this.stopBlinking();
      if (this.currentCount > 0) {
        const countText =
          this.currentCount > 99 ? "99+" : this.currentCount.toString();
        document.title = `(${countText}) ${this.originalTitle}`;

        // Start normal blinking if page is still hidden
        if (document.hidden) {
          this.startBlinking(countText);
        }
      }
    }, 5000);
  }

  // Stop blinking effect
  stopBlinking() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    this.isBlinking = false;

    // Restore title with current count
    if (typeof document !== "undefined" && this.currentCount > 0) {
      const countText =
        this.currentCount > 99 ? "99+" : this.currentCount.toString();
      document.title = `(${countText}) ${this.originalTitle}`;
    }
  }

  // Handle page visibility change
  handleVisibilityChange() {
    if (typeof document === "undefined") return;

    if (document.hidden) {
      // Page is hidden, start blinking if there are notifications
      if (this.currentCount > 0) {
        const countText =
          this.currentCount > 99 ? "99+" : this.currentCount.toString();
        this.startBlinking(countText);
      }
    } else {
      // Page is visible, stop blinking
      this.stopBlinking();
    }
  }

  // Reset to original title
  reset() {
    this.stopBlinking();
    if (typeof document !== "undefined" && this.originalTitle) {
      document.title = this.originalTitle;
    }
    this.currentCount = 0;
  }
}

// Create singleton instance
const pageTitleManager = new PageTitleManager();

// Auto-initialize and set up visibility change listener
if (typeof window !== "undefined") {
  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      pageTitleManager.init();
    });
  } else {
    pageTitleManager.init();
  }

  // Listen for visibility changes
  document.addEventListener("visibilitychange", () => {
    pageTitleManager.handleVisibilityChange();
  });

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    pageTitleManager.reset();
  });
}

export { pageTitleManager };
