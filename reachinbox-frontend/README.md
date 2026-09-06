# ReachInbox Scheduler — Frontend

A Vite + React 18 + TypeScript + Tailwind CSS dashboard for the Email Job Scheduler assignment, matching the provided Figma (Login, Homepage list, Compose modal with Send Later).

## Features implemented

- **Google OAuth login** via `@react-oauth/google`, with header avatar/name/email + logout.
  Falls back to a local demo profile automatically if no `VITE_GOOGLE_CLIENT_ID` is set, or if OAuth errors — so the app is always explorable offline.
- **Dashboard** with sidebar nav (Scheduled / Sent counts), debounced search, and a live BullMQ queue widget (`GET /api/queue/stats`, polled every 15s) linking to Bull Board at `/admin/queues`.
- **Scheduled Emails / Sent Emails tables**: recipient, subject, sender, time, status badges (`SCHEDULED`/`PROCESSING`/`RESCHEDULED`, `SENT`/`FAILED`), loading skeletons, empty states, and a detail view (click a row) with error details for failed sends.
- **Compose modal**: multi-recipient chips (manual entry, comma/space/Enter to add), CSV/TXT drag-and-drop or file-picker upload with regex email parsing and a "N detected" badge, sender selector, subject/body editor with a formatting toolbar, delay-between-emails and hourly-limit inputs, and a **Send Later** popover (quick "Tomorrow" slots + custom date/time picker).
- **Slack Connect modal**: connect via webhook URL (or OAuth token), test notification button, disconnect/reconnect, connected-state indicator in the sidebar.
- Toast notifications for success/error feedback on scheduling, Slack actions, and network failures.
- If the backend is unreachable, the dashboard transparently falls back to demo data (with a toast explaining why) so the UI can be reviewed without the backend running.

## Setup

```bash
npm install
cp .env.example .env
# edit .env with your backend URL and Google OAuth client ID
npm run dev
```

`vite.config.ts` proxies `/api/*` to `VITE_BACKEND_URL` (defaults to `http://localhost:4000`) during dev, so no CORS setup is needed locally.

## Expected backend endpoints

| Method | Path                     | Purpose                                   |
|--------|--------------------------|--------------------------------------------|
| POST   | `/api/auth/google`       | Exchange Google ID token for session token |
| GET    | `/api/emails/scheduled`  | List scheduled emails                      |
| GET    | `/api/emails/sent`       | List sent emails                           |
| POST   | `/api/emails/schedule`   | Schedule a batch of emails                 |
| GET    | `/api/emails/search?q=`  | Elasticsearch full-text search             |
| GET    | `/api/queue/stats`       | BullMQ counts (waiting/active/delayed/…)   |
| GET    | `/api/slack/status`      | Current Slack connection status            |
| POST   | `/api/slack/connect`     | Connect via webhook URL or OAuth token     |
| POST   | `/api/slack/disconnect`  | Disconnect Slack                           |
| POST   | `/api/slack/test`        | Send a live test notification              |

See `src/lib/api.ts` and `src/types/index.ts` for exact request/response shapes — adjust to match your backend's actual contracts.

## Structure

```
src/
  components/   # Sidebar, EmailList, ComposeModal, SlackModal, QueueWidget, Toast, etc.
  hooks/         # useAuth, useToast
  lib/api.ts     # Axios client + typed endpoint wrappers
  pages/         # LoginPage, DashboardPage
  types/         # Shared TS interfaces
```

## Build

```bash
npm run build   # tsc -b && vite build -> dist/
npm run preview
```
