import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X
} from 'lucide-react';
import { Drawer } from 'vaul'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { MENU_ITEMS } from '../config/navigation';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { User } from '../types';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { cn } from '../lib/utils';
import { AssistenteIA } from '../components/ia/AssistenteIA';
// Tipo local para os logs de auditoria do polling
interface SystemLog {
  id: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FRAUD_ATTEMPT';
  acao: string;
  resolvido: boolean;
}

// --- COMPONENTES AUXILIARES ---

interface SidebarContentProps {
  onClose?: () => void;
  user: User | null;
}

// 🛠️ Extraímos o miolo da Sidebar para reaproveitarmos no Desktop e no Mobile
function SidebarContent({ onClose, user }: SidebarContentProps) {
  const location = useLocation();

  return (
    <>
      {/* Topo do Sidebar - Foto do Usuário e Nome */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-border/60 shrink-0 relative bg-surface">
        {onClose && (
          <Button variant="ghost" size="icon"
            onClick={onClose} 
            className="absolute top-4 right-4 xl:hidden p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/minha-conta" className="group flex flex-col items-center gap-3 mt-4">
              <Avatar url={user?.fotoUrl} nome={user?.nome} size="lg" className="w-20 h-20 border-4 border-surface shadow-md group-hover:border-primary/50 transition-colors" />
              <div className="text-center px-4">
                <p className="text-base font-black text-text-main leading-tight group-hover:text-primary transition-colors">{user?.nome}</p>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">{user?.role || 'Acesso Restrito'}</p>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Acessar Minha Conta</TooltipContent>
        </Tooltip>
      </div>

      {/* Lista de Navegação (Scrollável) */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin">
        {MENU_ITEMS
          .filter((group) => !group.roles || (user?.role && group.roles.includes(user.role)))
          .map((group, idx) => (
          <div key={idx} className="animate-in slide-in-from-left-2 fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
            <h4 className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">
              {group.title}
            </h4>
            <nav className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = item.path === '/admin' 
                  ? location.pathname === '/admin' || location.pathname === '/admin/'
                  : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-primary text-white shadow-md hover:shadow-lg" 
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-main",
                      item.highlight && !isActive ? "border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" : "border border-transparent"
                    )}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-primary group-hover:scale-110'}`} />
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Rodapé da Sidebar (Apenas IA) */}
      <div className="p-4 border-t border-border/30 bg-surface-hover/10 shrink-0 space-y-3 pb-safe">
        <AssistenteIA />
      </div>
    </>
  );
}

// --- COMPONENTE PRINCIPAL (ORQUESTRADOR) ---

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { user } = useAuth();
  const location = useLocation();

  // 🔔 Hook de Push Notifications
  const { isSupported, subscription, subscribeToPush } = usePushNotifications();

  // Ativação Automática do Push para ADMINS
  useEffect(() => {
    if (user?.role === 'ADMIN' && isSupported && !subscription) {
      // Pequeno delay para não assustar no primeiro frame
      const timeout = setTimeout(() => {
        const jaFoiAvisado = sessionStorage.getItem('pushPrompted');
        if (!jaFoiAvisado && Notification.permission === 'default') {
          toast.info("Ativar Alertas Nativos?", {
            description: "Receba notificações sobre documentos e manutenções a vencer no seu celular.",
            action: {
              label: "Ativar",
              onClick: () => subscribeToPush()
            },
            duration: 10000
          });
          sessionStorage.setItem('pushPrompted', 'true');
        } else if (Notification.permission === 'granted' && !subscription) {
          // Se já tem permissão mas perdeu a assinatura (limpeza de cache), reassina silenciosamente
          subscribeToPush();
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, isSupported, subscription, subscribeToPush]);

  // Detecção robusta de Share Mode (suporta BrowserRouter e HashRouter)
  const isShareMode = 
    new URLSearchParams(location.search).get('share') === 'true' || 
    window.location.href.includes('share=true');

  // Fecha a sidebar no celular apenas quando a rota muda de facto
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // ✨ BIG BROTHER ALERTS (Polling invisível de 15s para Admins)
  const lastSeenLogId = useRef<string | null>(null);
  
  const { data: latestLogs } = useQuery<SystemLog[]>({
    queryKey: ['system-logs-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/logs');
      return data;
    },
    refetchInterval: 15000, 
    enabled: !!user && ['ADMIN', 'COORDENADOR'].includes(user.role),
  });

  useEffect(() => {
    if (latestLogs && latestLogs.length > 0) {
      const latestLog = latestLogs[0];
      
      if (!lastSeenLogId.current) {
        lastSeenLogId.current = latestLog.id;
        return;
      }

      if (latestLog.id !== lastSeenLogId.current) {
        const newLogs = latestLogs.slice(0, latestLogs.findIndex(l => l.id === lastSeenLogId.current));
        const criticalLogs = newLogs.filter(l => ['CRITICAL', 'FRAUD_ATTEMPT'].includes(l.nivel));
        
        if (criticalLogs.length > 0) {
          criticalLogs.forEach(log => {
             if (log.nivel === 'FRAUD_ATTEMPT') {
               toast.error(`ALERTA DE FRAUDE: ${log.acao.replace(/_/g, ' ')}`, { duration: 10000 });
             } else {
               toast.error(`ERRO CRÍTICO REPORTADO: ${log.acao.replace(/_/g, ' ')}`, { duration: 10000 });
             }
          });
        }
        lastSeenLogId.current = latestLog.id;
      }
    }
  }, [latestLogs]);

  return (
    <div className="flex h-[100dvh] bg-background w-full overflow-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* 💻 VISÃO DESKTOP: Sidebar Estática (Só aparece em xl+) */}
      {!isShareMode && (
        <aside className="hidden xl:flex w-[280px] flex-col bg-surface border-r border-border h-full relative z-10 shrink-0">
           <SidebarContent user={user} />
        </aside>
      )}

      {/* 📱 VISÃO MOBILE: Sidebar em Gaveta (Vaul Drawer) (Escondido em xl+) */}
      {!isShareMode && (
        <Drawer.Root direction="left" open={isShareMode ? false : isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 xl:hidden" />
            <Drawer.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface border-r border-border outline-none xl:hidden">
              
              <div className="sr-only">
                <Drawer.Title>Menu de Navegação</Drawer.Title>
                <Drawer.Description>Acesso às áreas da Frota KLIN.</Drawer.Description>
              </div>
              
              <SidebarContent onClose={() => setIsSidebarOpen(false)} user={user} />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Menu Mobile Flutuante */}
        {!isShareMode && (
          <div className="absolute top-4 left-4 z-40 xl:hidden">
            <Button variant="ghost" size="icon"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setIsSidebarOpen(true);
                }}
                className="p-2 text-text-main hover:bg-surface-hover rounded-xl shadow-md bg-surface border border-border/50"
            >
                <Menu className="w-6 h-6" />
            </Button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background scrollbar-thin scroll-smooth relative flex flex-col">
            
            {/* Conteúdo das Páginas (Outlet) com Transição Suave Framer Motion */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={location.pathname} 
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex-1 w-full max-w-[1600px] mx-auto pb-10 ${
                  isShareMode ? 'p-0' : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10'
                }`}
              >
                  <Outlet />
              </motion.div>
            </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


