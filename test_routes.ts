import express from "express";
import { registerRoutes } from "./server/routes";

const app = express();
console.log("Tentando carregar as rotas...");
registerRoutes(app).then(() => {
    console.log("Rotas carregadas com sucesso!");
}).catch(err => {
    console.error("ERRO NAS ROTAS:");
    console.error(err);
});
