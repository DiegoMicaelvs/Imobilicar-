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
  
  // Confia que o roteador do Express encontre o req.url corretamente
  return app(req, res);
}
