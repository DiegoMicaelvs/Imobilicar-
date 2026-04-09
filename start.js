import 'dotenv/config';
import { spawn } from 'child_process';

console.log("🚀 Iniciando Imobilicar localmente...");

const child = spawn('node', ['out.js'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit'
});

child.on('close', (code) => {
    console.log(`Processo finalizado com código ${code}`);
});
