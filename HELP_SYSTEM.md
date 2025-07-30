# Help System Documentation

## Overview

The help system allows students to submit coding doubts and get help from code reviewers. It includes doubt submission, review, resolution, and archiving.

## Features

### 1. User Help Page (`/user/help`)

- Students can submit coding doubts
- Form includes:
  - Title (required)
  - Category selection (Environment bug, Code not running, etc.)
  - Auto-detected user details and timestamp
  - File attachment support (up to 100KB, text/code files only)
  - Description (required)

### 2. Code Reviewers Dashboard (`/reviewers/dashboard`)

- Accessible to authorized reviewers only
- View and assign pending doubts
- Solve doubts with detailed solutions
- Real-time updates using Firebase

### 3. User's Doubts Tracking (`/user/my-doubts`)

- Students can track their submitted doubts
- View pending and resolved doubts
- Mark solutions as satisfactory
- "I am satisfied" button to archive doubts

### 4. Public Doubts Archive (`/all/doubts`)

- Searchable archive of resolved doubts
- Filter by category
- Pagination support (5 per page)
- Expandable view for detailed solutions

### 5. Notification System

- Users get notified when their doubts are solved
- Reviewers get notified about new doubts
- Integration with existing notification center

## Categories

1. Environment bug
2. Code not running
3. Compiler error
4. Debug my code
5. Give me hint
6. Explain the idea
7. Explain the code

## Firebase Structure

### /doubts

```json
{
  "doubtId": {
    "title": "string",
    "category": "string",
    "description": "string",
    "attachment": {
      "name": "string",
      "content": "string",
      "size": "number"
    },
    "userDetails": {
      "name": "string",
      "roll": "string",
      "email": "string"
    },
    "timestamp": "number",
    "status": "pending|assigned|resolved",
    "assignedTo": {
      "name": "string",
      "roll": "string",
      "assignedAt": "number"
    },
    "createdAt": "string"
  }
}
```

### /resolvedDoubts

```json
{
  "doubtId": {
    // ... all doubt data
    "solution": {
      "content": "string",
      "solvedBy": {
        "name": "string",
        "roll": "string"
      },
      "solvedAt": "number"
    },
    "userSatisfied": "boolean",
    "satisfiedAt": "number",
    "status": "completed"
  }
}
```

## API Endpoints

### POST /api/doubt-notifications

Actions:

- `notify_solution`: Notify user when doubt is solved
- `notify_reviewers`: Notify reviewers about new doubt
- `mark_satisfied`: Mark doubt as satisfied and archive

## Navigation Integration

- Help links added to main navigation (desktop & mobile)
- Quick action buttons in user dashboard
- "Get Help" and "Browse Doubts" in Contact & Help dropdown

## Access Control

- Only authorized reviewers can access reviewer dashboard
- Users can only see their own doubts in tracking page
- Public archive is accessible to all

## File Attachments

- Maximum size: 100KB
- Supported formats: Text files and common code extensions
- Content is stored as text in Firebase

## Workflow

1. Student submits doubt via `/user/help`
2. Reviewers are notified
3. Reviewer assigns doubt to themselves
4. Reviewer provides solution
5. User is notified about solution
6. User marks as satisfied (optional)
7. Doubt moves to public archive for searchability
