# Tenka Musō

Tenka Musō is a personal productivity, task-management, time-tracking and journaling web application.

It is designed to help users organize daily activities, keep track of completed work, manage future ideas through a backlog and review their progress across different time periods.

> **Status:** Active development

## Features

- Daily, weekly and monthly task views
- Task creation, editing and completion tracking
- Start and end time tracking
- Time and activity statistics
- Custom task categories
- Backlog management
- Backlog priority and status filtering
- Daily journal notes
- Search across tasks and journal entries
- User profile and application settings
- Anonymous authentication
- Google authentication
- Real-time cloud synchronization
- Responsive mobile interface
- Progressive Web App support

## Application Views

### Today

Manage the selected day's tasks, record activity times and write a daily journal note.

### Week

Review task completion and tracked time across the selected week.

### Month

Browse activities through a calendar-based monthly overview.

### Statistics

View completed activities and tracked time by category for the current day, week, month and all time.

### Backlog

Store ideas and future tasks without assigning them immediately to a specific day.

Backlog items support:

- priority levels,
- workflow statuses,
- category filters,
- sorting options.

### Search

Search tasks and journal entries using text, category, type, status and date filters.

### Profile

Manage the user's display name, default category, default view and application preferences.

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend and Data

- Firebase Authentication
- Cloud Firestore
- Real-time Firestore listeners

### Deployment

- Netlify
- Progressive Web App manifest
- Service worker

## Authentication

Tenka Musō automatically creates an anonymous Firebase session, allowing users to start using the application immediately.

Users can also authenticate with a Google account. Each user's data is stored under their own Firebase user ID.

## Firestore Data Model

```text
users/{userId}/tasks/{taskId}
users/{userId}/categories/{categoryId}
users/{userId}/dailyNotes/{date}
users/{userId}/settings/app
```

This structure keeps tasks, notes, categories and settings isolated between users.

## Architecture

```text
React User Interface
        ↓
Application State and View Logic
        ↓
Firebase Authentication
        ↓
Cloud Firestore
        ↓
User Tasks, Notes, Categories and Settings
```

The application uses real-time Firestore subscriptions to synchronize user data with the interface.

## Progressive Web App

Tenka Musō includes:

- a web application manifest,
- standalone display support,
- mobile application metadata,
- application icons,
- a registered service worker.

The application can therefore be installed and opened similarly to a native application on supported devices.

## Local Development

### Requirements

- Node.js
- npm
- A Firebase project

### Installation

```bash
git clone https://github.com/ChristosGiann/Tenka-Muso.git
cd Tenka-Muso
npm install
```

Create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

## Deployment

The repository contains a Netlify configuration that:

- builds the application using `npm run build`,
- publishes the `dist` directory,
- redirects application routes to `index.html`.

## Current Limitations

- The main application component still contains several responsibilities and is planned to be split into focused views, hooks and services.
- Automated tests have not yet been added.
- Bundle-size optimization and route-level code splitting are planned.
- Push-notification reminders require further technical investigation.

## Roadmap

- Refactor the main application component
- Add automated tests
- Add CI checks for linting and production builds
- Improve bundle size with lazy loading
- Improve backlog scheduling
- Add recurring routines
- Add long-term goals and project tracking
- Explore PWA task reminders
- Add data import functionality

## Project Structure

```text
src/
├── components/
├── constants/
├── lib/
├── styles/
├── types/
├── utils/
├── App.tsx
└── main.tsx

public/
├── icons/
├── manifest.webmanifest
└── service-worker.js
```

## License

No license has currently been specified for this project.
