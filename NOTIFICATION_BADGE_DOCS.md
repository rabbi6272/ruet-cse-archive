# Notification Badge System

This system adds notification count badges to the dashboard button in the navbar and provides reusable components for displaying notification counts throughout the application.

## Browser Compatibility

- **Notification Sounds**: Uses Web Audio API with HTML5 Audio fallback (supported in all modern browsers)
- **Audio Policies**: Automatically handles browser autoplay restrictions
- **Page Title**: Uses document.title API (universal browser support)
- **Page Visibility**: Uses document.hidden and visibilitychange events (modern browsers)
- **CSS**: Uses Tailwind CSS classes compatible with all modern browsers
- **JavaScript**: Uses modern React hooks and ES6+ features throughout the application.

## Components

### 1. NotificationBadge (`/components/ui/NotificationBadge.jsx`)

A reusable badge component that displays notification counts.

**Props:**

- `count` (number): The number to display in the badge
- `className` (string): Additional CSS classes
- `size` (string): Badge size - "xs", "sm", or "md" (default: "sm")

**Features:**

- Shows "99+" for counts over 99
- Automatically hides when count is 0
- Includes a subtle pulse animation
- Responsive sizing

**Usage:**

```jsx
import { NotificationBadge } from "@/components/ui/NotificationBadge";

<div className="relative">
  <button>Dashboard</button>
  <NotificationBadge count={5} size="sm" />
</div>;
```

### 2. DashboardLink (`/components/ui/DashboardLink.jsx`)

A complete dashboard link component with integrated notification badge.

**Props:**

- `className` (string): CSS classes for the link
- `badgeSize` (string): Size of the notification badge
- `showText` (boolean): Whether to show "Dashboard" text (default: true)
- `children` (ReactNode): Custom content for the link

**Features:**

- Automatically fetches user data from localStorage
- Shows notification count for logged-in users
- Handles loading and error states
- Customizable appearance

**Usage:**

```jsx
import { DashboardLink } from "@/components/ui/DashboardLink";

// Basic usage
<DashboardLink className="btn btn-primary" />

// Icon only
<DashboardLink
  className="icon-button"
  showText={false}
  badgeSize="xs"
/>

// Custom content
<DashboardLink className="custom-link">
  Go to Dashboard
</DashboardLink>
```

### 3. useNotificationCount Hook (`/lib/useNotificationCount.js`)

A custom hook for fetching notification counts from Firebase.

**Parameters:**

- `userRoll` (string): The user's roll number
- `playSound` (boolean): Whether to play sound on new notifications (default: false)

**Returns:**

- `unreadCount` (number): Number of unread notifications
- `isLoading` (boolean): Loading state
- `error` (string|null): Error message if any

**Features:**

- Real-time updates via Firebase listeners
- Error handling and loading states
- Optional notification sounds
- Automatic cleanup on unmount

**Usage:**

```jsx
import { useNotificationCount } from "@/lib/useNotificationCount";

function MyComponent() {
  const { unreadCount, isLoading, error } = useNotificationCount(
    userRoll,
    true
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>You have {unreadCount} notifications</div>;
}
```

## Implementation in Navbar

The notification badge has been integrated into the existing `LoginButton` component in `/components/home/mobile-navbar-links.jsx`. This component is used in both desktop and mobile navigation.

**Key Changes:**

1. Added imports for the notification hook and badge component
2. Enhanced user data parsing to extract roll number
3. Integrated the notification count hook
4. Added the notification badge to the dashboard link
5. Added error handling and loading states

## Firebase Database Structure

The system expects notifications to be stored in Firebase Realtime Database with this structure:

```
notifications/
  {userRoll}/
    {notificationId}/
      read: boolean
      type: string
      message: string
      createdAt: string
      // ... other notification data
```

## Styling

The notification badge uses Tailwind CSS classes and includes:

- Red background (`bg-red-500`)
- White text
- Rounded appearance
- Absolute positioning
- Pulse animation for attention
- Responsive sizing based on the `size` prop

## Sound System

### NotificationSound Class (`/lib/notificationSound.js`)

A robust notification sound system that handles browser audio policies and provides fallback options.

**Features:**

- Automatic initialization after user interaction
- Web Audio API with HTML5 Audio fallback
- Handles browser autoplay restrictions
- Singleton pattern for consistent behavior across components

**Auto-Initialization:**
The sound system automatically initializes on the first user interaction (click, keydown, or touchstart) to comply with browser autoplay policies.

**Usage in Hooks:**

```jsx
import { notificationSound } from "@/lib/notificationSound";

// Play notification sound
await notificationSound.playNotificationSound();

// Or use fallback method
notificationSound.playFallbackSound();
```

## Performance Considerations

1. **Firebase Listeners**: Automatically cleaned up on component unmount
2. **Sound Generation**: Only created when needed, not stored in memory
3. **Error Handling**: Graceful degradation if Firebase is unavailable
4. **Loading States**: Prevents unnecessary badge rendering during data fetch

## Troubleshooting

**Badge not showing:**

- Check if user is logged in
- Verify Firebase connection
- Ensure notifications exist in database
- Check browser console for errors

**Sound not playing:**

- Some browsers require user interaction before playing audio
- Check browser's autoplay policies
- Verify Web Audio API support

**Styling issues:**

- Ensure Tailwind CSS is properly configured
- Check for CSS conflicts with existing styles
- Verify z-index values for proper layering
