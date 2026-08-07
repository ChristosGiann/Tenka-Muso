# Firebase / Firestore Data Model

This document describes the current Firestore structure used by Tenka Musō and the basic security rules that should protect user data.

## Goal

Each authenticated Firebase user should only be able to read and write their own data.

The app stores user-owned data under:

```txt
users/{uid}
```

where `{uid}` is the Firebase Authentication user id.

---

## Collections

### `users/{uid}/tasks`

Stores tasks, routines and backlog items.

Current fields used by the app:

```ts
{
  title: string;
  type: "task" | "routine" | "backlog";
  category: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm or empty string
  endTime: string; // HH:mm or empty string
  status: "pending" | "done";
  notes: string;
  priority: "low" | "medium" | "high";
  backlogStatus: "idea" | "someday" | "planned";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Notes:

- `type: "task"` is used for normal dated tasks.
- `type: "routine"` currently exists as a task type, but true recurring routine behavior will be designed separately.
- `type: "backlog"` is used for ideas or tasks not yet scheduled for a specific day.
- `priority` and `backlogStatus` are mainly useful for backlog items.
- `date` is currently stored as a string in `YYYY-MM-DD` format.

---

### `users/{uid}/categories`

Stores custom categories created by the user.

Current fields:

```ts
{
  name: string;
  createdAt: Timestamp;
}
```

Notes:

- Default categories are defined in the frontend.
- This collection stores only user-created categories.

---

### `users/{uid}/dailyNotes`

Stores daily journal notes.

Document id:

```txt
YYYY-MM-DD
```

Example path:

```txt
users/{uid}/dailyNotes/2026-08-07
```

Current fields:

```ts
{
  date: string; // YYYY-MM-DD
  content: string;
  updatedAt: Timestamp;
}
```

Notes:

- One document represents one day.
- The document id matches the date.

---

### `users/{uid}/settings/app`

Stores app-level settings for the user.

Current fields:

```ts
{
  defaultCategory: string;
  defaultView: "today" | "week" | "month" | "stats" | "backlog" | "search" | "profile";
  themePreference: string;
  updatedAt: Timestamp;
}
```

Notes:

- `defaultView` is validated in the frontend before being used.
- `themePreference` currently defaults to the manga grayscale / sumi-e theme.
- More settings may be added later.

---

## Planned future collections

These are not required for the current app version, but may be added later.

### Routine rules

Possible future structure:

```txt
users/{uid}/routines/{routineId}
```

For true recurring routines with weekday rules.

### Routine occurrence overrides

Possible future structure:

```txt
users/{uid}/routineOccurrences/{routineId_date}
```

For per-day completion or skip exceptions.

Example use cases:

- Routine active Monday-Friday, but skipped on one specific Wednesday.
- Routine done on a specific date without marking the whole routine as completed.

---

## Security model

The basic rule is:

```txt
A user can only access documents under users/{theirOwnUid}.
```

The frontend already writes and reads data using the current Firebase user's `uid`.

Example paths:

```txt
users/{uid}/tasks
users/{uid}/categories
users/{uid}/dailyNotes
users/{uid}/settings/app
```

---

## Example Firestore Security Rules

These rules are intentionally simple and user-scoped.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /{document=**} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

## What these rules protect

Allowed:

```txt
User A reads/writes users/UserA/tasks/{taskId}
User A reads/writes users/UserA/categories/{categoryId}
User A reads/writes users/UserA/dailyNotes/{date}
User A reads/writes users/UserA/settings/app
```

Denied:

```txt
User A reads/writes users/UserB/tasks/{taskId}
Unauthenticated user reads/writes any user data
```

---

## Notes about validation

The current rules only protect ownership by user id.

They do not yet validate field shape, allowed enum values, date format or string lengths.

Future stricter rules may validate fields such as:

```txt
title
type
category
date
status
priority
backlogStatus
defaultView
```

For now, field validation is handled mainly by the frontend.

---

## Development checklist

When adding a new Firestore collection:

1. Keep it under `users/{uid}` unless there is a clear reason not to.
2. Document the path in this file.
3. Document the fields.
4. Update security rules if the path is not covered.
5. Make sure users cannot read or write another user's data.
6. Run `npm run build` if runtime code changed.