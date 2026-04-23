import "dotenv/config";
import express, { type Request, Response } from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: false, limit: "200mb" }));
app.use("/attached_assets", express.static("attached_assets"));

let isInitialized = false;

// Em ambiente Serverless, Vercel injeta a request e a response diretamente nesta função
export default async function handler(req: Request, res: Response) {
  if (!isInitialized) {
    await registerRoutes(app);
    isInitialized = true;
  }
  
  // Vercel routes to `/api` often strip the `/api` prefix in `req.url`.
  // Express expects routes to match exactly e.g. `/api/admin/auth`.
  // So we ensure `req.url` starts with `/api` if it doesn't already.
  const originalUrl = req.url;
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }
  
  console.log(`[Vercel Serverless] Routing request: originalUrl=${originalUrl} -> req.url=${req.url}`);

  return app(req, res);
}

