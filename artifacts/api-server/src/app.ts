import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production (Railway), serve the built frontend static files.
// The frontend is built to: artifacts/magic-dashboard/dist/public
// At runtime the API bundle is at: artifacts/api-server/dist/index.mjs
// so we walk up two levels to reach the workspace root.
if (process.env.NODE_ENV === "production") {
  const workspaceRoot = path.resolve(__dirname, "../../..");
  const staticDir = path.join(workspaceRoot, "artifacts/magic-dashboard/dist/public");

  if (existsSync(staticDir)) {
    logger.info({ staticDir }, "Serving frontend static files");
    app.use(express.static(staticDir));

    // SPA fallback — serve index.html for any non-API route (Express 5 named wildcard)
    app.get("/{*any}", (_req: Request, res: Response) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  } else {
    logger.warn({ staticDir }, "Frontend build not found; static serving disabled");
  }
}

export default app;
