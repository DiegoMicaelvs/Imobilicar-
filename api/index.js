import app from '../dist/index.js';

export default function handler(req, res) {
  const originalUrl = req.url;
  
  // Se a rota chegou sem o prefixo /api (por causa do rewrite do Vercel), adicionamos novamente
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  
  console.log(`[Vercel Express Wrapper] Routing request: originalUrl=${originalUrl} -> req.url=${req.url}`);

  return app(req, res);
}
