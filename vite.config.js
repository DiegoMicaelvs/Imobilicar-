import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const cleanRoot = path.resolve(__dirname);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(cleanRoot, "client/src"),
            "@shared": path.resolve(cleanRoot, "shared"),
            "@assets": path.resolve(cleanRoot, "attached_assets"),
        },
    },
    root: path.resolve(cleanRoot, "client"),
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "../dist/public",
        emptyOutDir: true,
    },
});
