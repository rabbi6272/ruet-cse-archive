# Global Presence Tracking System

## Overview

The platform now features a comprehensive real-time presence tracking system that monitors active users across all pages of the application.

## Key Features

### 1. Global Tracking

- **GlobalPresenceTracker**: Added to root layout (`app/layout.jsx`) to track users across all pages
- **Automatic Detection**: Detects user login/logout and starts/stops tracking automatically
- **Cross-Page Tracking**: Users remain "active" while navigating between pages
- **Session Management**: Uses Firebase's built-in connection detection for reliable presence tracking

### 2. Real-Time Updates

- **Firebase Integration**: Uses Firebase Realtime Database for instant presence updates
- **Heartbeat System**: 30-second intervals to maintain active status
- **Connection Monitoring**: Automatically handles reconnections and disconnections
- **Session Validation**: Tracks session IDs and validates active sessions
- **Grace Period**: 2-minute buffer after disconnect to prevent rapid on/off status changes

### 3. Enhanced User Information

- **Current Page Tracking**: Shows which page each user is currently viewing
- **Activity Timestamps**: Displays when users were last active
- **Session Status**: Indicates connection state and session information
- **2-Minute Grace Period**: Users remain "active" for 2 minutes after disconnect to avoid glitches
- **Status Indicators**: Three states - Online (green), Recently Active (yellow), and Offline (gray)
- **Automatic Cleanup**: Removes stale sessions after 2 minutes of inactivity

### 4. Components

#### GlobalPresenceTracker

- **Location**: `components/providers/GlobalPresenceTracker.jsx`
- **Purpose**: Handles global presence tracking across all pages
- **Features**:
  - Page navigation detection
  - Storage change monitoring (multi-tab support)
  - Visibility API integration
  - Periodic health checks

#### ActiveUsersList

- **Location**: `components/user/ActiveUsersList.jsx`
- **Purpose**: Comprehensive list view of all active users
- **Features**:
  - Real-time user list with avatars
  - Current page display
  - Activity timestamps
  - Responsive design
  - Loading and error states

#### ActiveUsersIndicator

- **Location**: `components/ui/ActiveUsersIndicator.jsx`
- **Purpose**: Compact indicator with popup details
- **Features**:
  - Active user count
  - Dropdown with user details
  - Mobile-responsive popup
  - Current page information

### 5. Technical Implementation

#### Presence Data Structure

```javascript
{
  name: "User Name",
  roll: "user123",
  lastSeen: serverTimestamp(),
  isOnline: true,
  timestamp: 1234567890,
  sessionId: "unique_session_id",
  connectedAt: serverTimestamp(),
  currentPage: "/user/dashboard",
  lastActivity: serverTimestamp()
}
```

#### Session Data Structure

```javascript
{
  name: "User Name",
  roll: "user123",
  sessionId: "unique_session_id",
  startTime: serverTimestamp(),
  lastActivity: serverTimestamp(),
  currentPage: "/user/dashboard",
  status: "active"
}
```

### 6. Page Name Mapping

The system includes intelligent page name mapping for better user experience:

- `/` → "Home"
- `/user/dashboard` → "Dashboard"
- `/codelibrary` → "Code Library"
- `/resources` → "Resources"
- `/contact&help/help` → "Help"
- And many more...

### 7. Removed Duplicate Tracking

- Removed presence tracking from individual components
- Centralized tracking in GlobalPresenceTracker
- Eliminated conflicts between multiple tracking instances

## Benefits

1. **Real-Time Community Feel**: Users can see who else is online and what they're doing
2. **Better Engagement**: Encourages interaction when users see others are active
3. **Glitch-Free Experience**: 2-minute grace period prevents rapid status changes
4. **Smart Status Indicators**: Visual differentiation between online, recently active, and offline users
5. **Platform Analytics**: Provides insights into user behavior and popular pages
6. **Reliable Tracking**: Uses Firebase's proven connection detection
7. **Cross-Platform**: Works consistently across desktop and mobile devices

## Usage

The system works automatically once users are logged in. No additional setup required:

1. User logs in → Presence tracking starts automatically
2. User navigates pages → Current page is tracked and updated
3. User goes offline → Presence is cleaned up automatically
4. Other users see real-time updates of who's online and where

## Mobile Responsiveness

All components are fully responsive:

- Compact view on mobile devices
- Touch-friendly interfaces
- Optimized popup positioning
- Readable text at all screen sizes

This implementation provides a robust, scalable, and user-friendly presence tracking system that enhances the overall platform experience.
