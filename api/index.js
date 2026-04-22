// Vercel Serverless Function — Entry point para todas as rotas /api/*
// A Vercel compila este arquivo com @vercel/node automaticamente

import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: false, limit: "200mb" }));
app.use("/attached_assets", express.static("attached_assets"));

// Registrar todas as rotas da API
let routesRegistered = false;
const init = (async () => {
  await registerRoutes(app);
  routesRegistered = true;
})();

// Handler padrão da Vercel
export default async (req, res) => {
  await init;
  return app(req, res);
};
