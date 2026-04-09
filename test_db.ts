import { db } from "./server/db.ts";
import { sql } from "drizzle-orm";

async function test() {
    try {
        console.log("Tentando conectar ao banco (com caminhos relativos)...");
        const result = await db.execute(sql`SELECT 1`);
        console.log("Conexão bem-sucedida!", result);
        process.exit(0);
    } catch (err) {
        console.error("Erro na conexão:");
        console.error(err);
        process.exit(1);
    }
}

test();
