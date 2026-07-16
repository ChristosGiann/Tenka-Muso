# Tenka Musō

Tenka Musō is a personal productivity, task management, time-tracking and journaling web application.

It is designed to help users organize daily activities, keep track of completed work, manage future ideas through a backlog and review their progress across different time periods.

> Status: Active development

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

Users can also authenticate with a Google account.

Each user's data is stored under their own Firebase user ID.

## Firestore Data Model

```text
users/{userId}/tasks/{taskId}
users/{userId}/categories/{categoryId}
users/{userId}/dailyNotes/{date}
users/{userId}/settings/app
