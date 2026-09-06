import express from "express";
import cors from "cors";
import { emailRouter } from "./routes/emailRoutes";
import { bullBoardRouter } from "./routes/bullBoard";
import { queueRouter } from "./routes/queueRoutes";
import { slackRouter } from "./routes/slackRoutes";
import { authRouter } from "./routes/authRoutes";

export const app = express();

app.use(cors());
app.use(express.json());

// Bull Board UI for queue monitoring
app.use("/admin/queues", bullBoardRouter);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/emails", emailRouter);
app.use("/api/queue", queueRouter);
app.use("/api/slack", slackRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Root welcome
app.get("/", (_req, res) => {
  res.json({
    name: "ReachInbox Email Scheduler API",
    endpoints: {
      bullBoard: "/admin/queues",
      googleLogin: "POST /api/auth/google",
      schedule: "POST /api/emails/schedule",
      scheduled: "GET /api/emails/scheduled",
      sent: "GET /api/emails/sent",
      search: "GET /api/emails/search?q=...",
      health: "GET /api/health",
    },
  });
});
