# Authentication Workflow

This project now uses a simpler email/password login flow:

1. The user signs in with email and password.
2. The browser reads the public `users` node from Firebase Realtime Database.
3. The app matches the submitted email against the stored user record.
4. If the password matches, the app stores a local session and starts a Firebase Auth session.
5. The local session drives the UI, while Firebase Auth keeps protected database writes working.

## Why this exists

The app still needs a real Firebase Auth session for protected writes because the database rules require `auth != null`. The login itself is now direct and does not depend on a custom token route.

## High-level flow

1. The user enters an email address and password in the login form.
2. The client reads the `users` node directly from Firebase.
3. The client finds the matching user by email.
4. The client compares the submitted password with the stored password.
5. If the credentials are valid, the app starts Firebase Auth with an anonymous session and stores a local user session.
6. The rest of the app uses the local session for UI state, while Firebase Auth satisfies database write rules.

## Login flow in detail

### 1. Login form submission

The login UI lives in [app/components/user/login.jsx](app/components/user/login.jsx).

When the form is submitted, the client:

- Normalizes the email address
- Reads the `users` node with the Firebase client SDK
- Searches for a record whose email or key matches the submitted email
- Compares the submitted password with the stored password

### 2. Direct database lookup

The lookup is client-side and does not use a token endpoint.

The code is written to handle either of these data shapes:

- `users/{email} -> user record`
- `users/{id} -> { email, password, name, roll, ... }`

That means the workflow can cope with a users database where email is the unique identifier, while still tolerating older record shapes.

### 3. Firebase Auth session

After the credentials are verified, [lib/firebase-auth-service.js](lib/firebase-auth-service.js) starts a Firebase anonymous sign-in through [lib/firebase.js](lib/firebase.js).

This is only used to satisfy Firebase Auth requirements for protected writes. It is not the primary identity lookup.

### 4. Local session storage

After the auth step succeeds, the client writes a local session through [lib/auth-utils-secure.js](lib/auth-utils-secure.js).

The stored session contains:

- `email`
- `roll`
- `name`
- `expiry`

This local session is used for fast UI checks, redirects, and app state.

## What each layer is responsible for

### `AuthUtils`

[lib/auth-utils-secure.js](lib/auth-utils-secure.js) is the local session helper. It:

- Stores the current user session in `localStorage`
- Reads the current session back
- Checks whether a session exists
- Clears the session on logout

This is not the source of truth for database security.

### `FirebaseAuthService`

[lib/firebase-auth-service.js](lib/firebase-auth-service.js) wraps Firebase Auth operations. It:

- Starts anonymous sign-in after a successful direct login
- Signs the user out
- Exposes a combined view of local session and Firebase user state

### `AuthProvider`

[app/components/providers/AuthProvider.jsx](app/components/providers/AuthProvider.jsx) keeps React UI state in sync with the stored local session.

It is responsible for:

- Reading the current session on app startup
- Updating auth state when local storage changes
- Exposing `user`, `isAuthenticated`, `isLoading`, `signOut`, and `refreshAuth`

### `ProtectedFirebaseDB`

[lib/protected-firebase-db.js](lib/protected-firebase-db.js) is the guarded database wrapper.

Before any protected read/write, it checks:

- A local user session exists
- The session still looks valid

The real write access still depends on Firebase Auth being present.

## Logout flow

Logout is handled from [app/components/ui/LogoutButton.jsx](app/components/ui/LogoutButton.jsx).

On logout, the app:

1. Signs the user out of Firebase Auth
2. Clears the local session from `localStorage`
3. Redirects the user back to the login page

## Important behavior to understand

- The app does not allow protected writes without a real login.
- The local session alone is not meant to bypass Firebase rules.
- The old token route is no longer part of the workflow.
- Email is the required unique identifier for login.

## Current data assumption

The `users` node is expected to contain records with at least:

- `email`
- `password`
- `name`
- `roll` or another stable identifier

## File map

- Login UI: [app/components/user/login.jsx](app/components/user/login.jsx)
- Local session helper: [lib/auth-utils-secure.js](lib/auth-utils-secure.js)
- Firebase auth wrapper: [lib/firebase-auth-service.js](lib/firebase-auth-service.js)
- Firebase client setup: [lib/firebase.js](lib/firebase.js)
- Protected DB wrapper: [lib/protected-firebase-db.js](lib/protected-firebase-db.js)
- Auth state provider: [app/components/providers/AuthProvider.jsx](app/components/providers/AuthProvider.jsx)
