// Service Worker desabilitado - apenas limpa caches existentes

self.addEventListener('install', () => {
  console.log('[SW] Desabilitado - instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Desabilitado - ativando e limpando todos os caches...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deletando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] Todos os caches foram limpos');
      return self.clients.claim();
    })
  );
});

// Não interceptar requisições - deixar o navegador gerenciar tudo
self.addEventListener('fetch', () => {
  return;
});
