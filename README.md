# ReachInbox — Full-Stack Email Job Scheduler

A production-style email scheduling service: it accepts email send requests, schedules them for a specific time using **BullMQ delayed jobs backed by Redis** (no cron), sends them through **Ethereal SMTP** (a fake SMTP service for testing), indexes every email in **Elasticsearch** for full-text search, and gives you a **React dashboard** to compose, schedule, and monitor emails — including live Slack alerts whenever a sender's hourly send limit is hit.

## What's inside

```
.
├── backend/               → TypeScript + Express + BullMQ + Postgres + Redis + Elasticsearch
├── reachinbox-frontend/   → Vite + React + TypeScript + Tailwind dashboard
└── docker-compose.yml     → Spins up Postgres, Redis, and Elasticsearch locally
```

**Backend** handles scheduling, sending, rate limiting, search indexing, and Slack alerts.
**Frontend** is the dashboard where you log in, compose emails, upload a lead list, and watch them get scheduled/sent in real time.

---

## What you need installed first

- **Node.js** (v18 or newer) — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop) (runs Postgres, Redis, and Elasticsearch for you, no manual install needed)
- **Git** — [git-scm.com](https://git-scm.com/downloads)

Check they're installed:
```bash
node -v
docker -v
git --version
```

---

## 1. Clone the repo

```bash
git clone https://github.com/bhargav20-ui/outbox-assignment.git
cd outbox-assignment
```

---

## 2. Start the infrastructure (Postgres, Redis, Elasticsearch)

From the repo root:
```bash
docker compose up -d
```
This runs all three in the background. Leave them running while you work.

---

## 3. Set up and run the backend

```bash
cd backend
npm install
```

Copy the example environment file and fill in real values:
```bash
cp .env.example .env
```

Open `.env` and fill in:
- **SMTP_USER / SMTP_PASSWORD** — get a free instant account at [ethereal.email/create](https://ethereal.email/create)
- **GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET** — from [console.cloud.google.com](https://console.cloud.google.com) (OAuth credentials)
- **SLACK_CLIENT_ID / SLACK_CLIENT_SECRET** — from [api.slack.com/apps](https://api.slack.com/apps)

(Google and Slack are optional for basic testing — the app runs fine without them, just those specific features won't work.)

Run it:
```bash
npm run dev
```

You should see:
```
--- Starting ReachInbox Email Scheduler Service ---
[DB] PostgreSQL initialized with emails table & indexes
[ES] Index 'emails' already exists
[Worker] Starting BullMQ worker with concurrency = 5
[Server] ReachInbox Email Scheduler running on port 5000
[Server] Bull Board UI: http://localhost:5000/admin/queues
```

Leave this terminal running.

---

## 4. Set up and run the frontend

Open a **new terminal window** (keep the backend running in the first one):

```bash
cd reachinbox-frontend
npm install
cp .env.example .env
```

Open `.env` and confirm:
```dotenv
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=          # optional — leave blank to use a demo login instead
```

Run it:
```bash
npm run dev
```

Open your browser to:
```
http://localhost:5173
```

---

## 5. Try it out

1. Log in (with Google, or the demo fallback button if you left the client ID blank).
2. Click **Compose**, add a recipient email, type a subject and body, and hit **Send**.
3. Watch the backend terminal — it'll show the email being picked up and sent.
4. Click the **Ethereal preview link** that appears in the terminal logs to see the actual email that was "sent" (Ethereal is a test service — it doesn't deliver to real inboxes).
5. Check the **Scheduled** and **Sent** tabs in the dashboard to see it listed.

---

## Everyday commands

| Command | Where | What it does |
|---|---|---|
| `docker compose up -d` | repo root | Start Postgres, Redis, Elasticsearch |
| `docker compose down` | repo root | Stop them |
| `npm run dev` | `backend/` | Start the backend with auto-reload |
| `npm run build` | `backend/` | Compile TypeScript for production |
| `npm run dev` | `reachinbox-frontend/` | Start the frontend dev server |
| `npm run build` | `reachinbox-frontend/` | Build the frontend for production |

---

## If something doesn't work

- **Backend won't start / DB errors** → make sure `docker compose up -d` actually ran and the containers are up (`docker ps` should show postgres/redis/elasticsearch running).
- **Frontend shows "demo data" / can't reach backend** → make sure the backend terminal is still running and `VITE_BACKEND_URL` in the frontend's `.env` matches the backend's port (default `5000`).
- **Google login fails** → it's optional; leave `VITE_GOOGLE_CLIENT_ID` blank in `.env` to use the demo login instead while you explore the app.
