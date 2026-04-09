import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Registrar Service Worker
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[App] Service Worker registrado');
          setRegistration(reg);

          // Verificar atualizações a cada 60 segundos
          setInterval(() => {
            console.log('[App] Verificando atualizações...');
            reg.update();
          }, 60000);

          // Detectar quando há nova versão instalando
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('[App] Nova versão detectada!');
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] Nova versão pronta para usar');
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[App] Erro ao registrar Service Worker:', error);
        });

      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATED') {
          console.log('[App] Service Worker atualizado:', event.data.version);
          setUpdateAvailable(true);
        }
      });

      // Detectar quando o SW assume controle (após atualização)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] Novo Service Worker assumiu controle');
        // Se não estamos recarregando ainda, recarregar a página
        if (!window.location.hash.includes('reloading')) {
          window.location.hash = 'reloading';
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    console.log('[App] Usuário solicitou atualização');
    
    if (registration && registration.waiting) {
      // Diz ao Service Worker em espera para assumir controle
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Se não há worker esperando, apenas recarregar
      window.location.reload();
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-sm">Nova versão disponível!</p>
            <p className="text-xs opacity-90">
              Uma atualização do sistema está pronta. Clique para atualizar sem perder seus dados.
            </p>
            <Button
              onClick={handleUpdate}
              size="sm"
              variant="secondary"
              className="w-full"
              data-testid="button-update-app"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Atualizar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
