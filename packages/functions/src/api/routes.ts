import { auth } from "@repo/core/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { agentApi } from "./agent";
import { coverLettersApi } from "./cover-letters";
import { handleError, type AppEnv, sessionMiddleware } from "./common";
import { jobsApi } from "./jobs";
import { resumesApi } from "./resumes";
import { uploadApi } from "./upload";
import { usersApi } from "./users";

const apiRoutes = new Hono<AppEnv>()
  .get("/", (c) =>
    c.json({
      name: "@repo/functions",
      status: "ok",
      routes: [
        "/api/auth/*",
        "/api/resumes",
        "/api/resumes/import-pdf",
        "/api/resumes/import-linkedin",
        "/api/cover-letters",
        "/api/cover-letters/import-pdf",
        "/api/jobs",
        "/api/users",
        "/api/cms/upload",
        "/api/agent",
      ],
    }),
  )
  .get("/doc", (c) =>
    c.json({
      name: "@repo/functions",
      version: "0.0.1",
      note: "Route inventory endpoint. Full OpenAPI generation can be added once the API surface stabilizes.",
      groups: {
        auth: "/api/auth/*",
        resumes: "/api/resumes",
        coverLetters: "/api/cover-letters",
        jobs: "/api/jobs",
        users: "/api/users",
        upload: "/api/cms/upload",
        agent: "/api/agent",
      },
    }),
  )
  .route("/resumes", resumesApi)
  .route("/cover-letters", coverLettersApi)
  .route("/jobs", jobsApi)
  .route("/users", usersApi)
  .route("/cms", uploadApi)
  .route("/agent", agentApi);

export const app = new Hono<AppEnv>();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.ADMIN_URL || "http://localhost:3001",
];

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);
app.use("/api/*", sessionMiddleware);

app.get("/", (c) =>
  c.json({ name: "wreny", status: "ok", docs: "/api" }),
);
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api", apiRoutes);
app.onError(handleError);

export { apiRoutes };
