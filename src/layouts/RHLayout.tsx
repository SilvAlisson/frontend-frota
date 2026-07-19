import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, Sun, Moon, KeyRound,
  LayoutDashboard, AlertTriangle,
  Users, Briefcase, FileBadge, ShieldCheck
} from 'lucide-react';
import { Drawer } from 'vaul'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from '../components/ui/ConfirmModal'; 
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { AssistenteIA } from '../components/ia/AssistenteIA';
import { ModalAlterarSenha } from '../components/ModalAlterarSenha';
import type { MenuGroup } from '../config/navigation';

const MENU_ITEMS_RH: MenuGroup[] = [
  {
    title: 'Visão Geral',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: AlertTriangle, label: 'Alertas', path: '/admin/alertas' },
    ]
  },
  {
    title: 'Cadastros',
    items: [
      { icon: Users, label: 'Integrantes', path: '/admin/integrantes' },
      { icon: Briefcase, label: 'Cargos e Matrizes', path: '/admin/cargos' },
      { icon: FileBadge, label: 'Documentos Legais', path: '/admin/documentos' },
    ]
  },
  {
    title: 'SST',
    items: [
      { icon: ShieldCheck, label: 'Gestão de SST', path: '/admin/sst', highlight: true },
      { icon: FileBadge, label: 'Matriz de Qualificação', path: '/admin/matriz' },
      { icon: Users, label: 'Convocações em Lote', path: '/admin/convocacoes' },
    ]
  }
];

function SidebarContentRH({ onClose, user }: { onClose?: () => void, user: any }) {
  const location = useLocation();

  return (
    <>
      {/* Topo do Sidebar - Foto do Usuário e Nome */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-border/60 shrink-0 relative bg-surface">
        {onClose && (
          <Button variant="ghost" size="icon"
            aria-label="Fechar menu"
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
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">{user?.role || 'RH'}</p>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Acessar Minha Conta</TooltipContent>
        </Tooltip>
      </div>

      {/* Navegação */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin">
        {MENU_ITEMS_RH.map((group, idx) => (
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

export function RHLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSenhaModalOpen, setIsSenhaModalOpen] = useState(false);
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout(); 
    navigate('/login');
  };

  return (
    <div className="flex h-[100dvh] bg-background w-full overflow-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* 💻 VISÃO DESKTOP: Sidebar */}
      <aside className="hidden xl:flex w-[280px] flex-col bg-surface border-r border-border h-full relative z-10 shrink-0">
         <SidebarContentRH user={user} />
      </aside>

      {/* 📱 VISÃO MOBILE: Sidebar em Gaveta */}
      <Drawer.Root direction="left" open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 xl:hidden" />
          <Drawer.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface border-r border-border outline-none xl:hidden">
            <SidebarContentRH onClose={() => setIsSidebarOpen(false)} user={user} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Cabeçalho Principal (Desktop + Mobile) */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-[88px] bg-background/80 backdrop-blur-xl sticky top-0 z-30 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon"
                aria-label="Abrir menu"
                onClick={() => setIsSidebarOpen(true)}
                className="xl:hidden p-2 -ml-2 text-text-main hover:bg-surface-hover rounded-xl shrink-0"
            >
                <Menu className="w-6 h-6" />
            </Button>
            
            <div className="hidden sm:flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-none flex items-center gap-3">
                 <div className="p-1.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 Recursos Humanos & SST
              </h2>
              <p className="text-xs text-text-secondary font-medium mt-1.5">
                 Gestão de Integrantes, acompanhamento de saúde e segurança, cargos e treinamentos.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  aria-label="Alternar tema"
                  onClick={toggleTheme}
                  className="p-2 text-text-muted hover:text-primary transition-colors bg-surface border border-border/50 shadow-sm rounded-xl"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Alternar Tema</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  aria-label="Alterar senha"
                  onClick={() => setIsSenhaModalOpen(true)}
                  className="p-2 text-text-muted hover:text-primary transition-colors bg-surface border border-border/50 shadow-sm rounded-xl"
                >
                  <KeyRound className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Alterar Senha</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  aria-label="Sair"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="p-2 text-text-muted hover:text-error transition-colors bg-surface border border-border/50 shadow-sm rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sair do Sistema</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background scrollbar-thin scroll-smooth relative flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={location.pathname} 
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-10"
              >
                  <Outlet />
              </motion.div>
            </AnimatePresence>
        </main>
      </div>

      <ModalAlterarSenha isOpen={isSenhaModalOpen} onClose={() => setIsSenhaModalOpen(false)} />
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Encerrar Sessão"
        description="Tem certeza que deseja fechar a sua sessão e sair do sistema?"
        confirmLabel="Sair do Sistema?"
        variant="danger"
      />
    </div>
  );
}
