import * as schema from "./shared/schema";
console.log("Schema carregado com sucesso!");
console.log("Tabelas:", Object.keys(schema).filter(k => k !== "default").length);
