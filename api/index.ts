import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: false, limit: "200mb" }));

let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    await registerRoutes(app);
    isInitialized = true;
  }
  
  // Vercel routes sometimes strip the /api prefix, but Express router expects it.
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }

  return app(req, res);
}
