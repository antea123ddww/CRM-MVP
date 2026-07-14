import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import contactRoutes from "./routes/contact.routes";
import leadRoutes from "./routes/lead.routes";
import dealRoutes from "./routes/deal.routes";
import taskRoutes from "./routes/task.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import activityRoutes from "./routes/activity.routes";
import noteRoutes from "./routes/note.routes";
import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import rateLimit from "express-rate-limit";
import auditRoutes from "./routes/audit.routes";
import userRoutes from "./routes/user.routes";
import settingRoutes from "./routes/setting.routes";
import teamPerformanceRoutes from "./routes/team-performance.routes";
import { auditMiddleware } from "./middleware/audit";
import { csrfMiddleware } from "./middleware/csrf";
import { performanceMiddleware } from "./middleware/performance";

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL;

if (isProduction) {
  app.set("trust proxy", 1);
}

if (!frontendUrl) {
  throw new Error("FRONTEND_URL environment variable is required.");
}

const rateLimitMax = Number(
  process.env.RATE_LIMIT_MAX || (isProduction ? 100 : 1000)
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: rateLimitMax,
  message: {
    message: "Too many requests, please try again later.",
  },
});

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(performanceMiddleware);
app.use(limiter);
app.use(auditMiddleware);
app.use(csrfMiddleware);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "CRM MVP API",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/team-performance", teamPerformanceRoutes);

export default app;
