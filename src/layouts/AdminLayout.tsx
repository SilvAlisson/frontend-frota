import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, BarChart3, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVeiculos } from '../hooks/useVeiculos';
import { ConfirmModal } from '../components/ui/ConfirmModal'; 
import { ModalRelatorioFinanceiro } from '../components/ModalRelatorioFinanceiro';
import { Button } from '../components/ui/Button';
import { MENU_ITEMS } from '../config/navigation';

// --- COMPONENTES AUXILIARES ---

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  onOpenFinanceiro: () => void;
}

function Sidebar({ isOpen, onClose, user, onLogout, onOpenFinanceiro }: SidebarProps) {
  const location = useLocation();

  // Fechar sidebar ao mudar de rota (específico para mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseClasses = "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface/95 backdrop-blur-xl border-r border-border/60 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:translate-x-0 lg:static lg:h-full";
  const mobileClasses = isOpen ? "translate-x-0 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.1)]" : "-translate-x-full lg:shadow-none";

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`${baseClasses} ${mobileClasses}`}>
        {/* Header da Sidebar */}
        <div className="flex h-[72px] items-center justify-between px-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
              F
            </div>
            <div>
              <span className="block font-black text-[15px] text-text-main tracking-tight leading-none">FROTA <span className="text-primary">PRO</span></span>
              <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1 opacity-80">Workspace</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 -mr-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegação (Scrollável) */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {MENU_ITEMS.map((group, idx) => (
            <div key={idx} className="animate-in slide-in-from-left-2 fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              <h4 className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">
                {group.title}
              </h4>
              <nav className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = item.path === '/admin' 
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group relative overflow-hidden
                        ${isActive 
                          ? 'bg-primary text-white shadow-md hover:shadow-lg' 
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'
                        }
                        ${item.highlight && !isActive ? 'border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10' : 'border border-transparent'}
                      `}
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

        {/* Rodapé da Sidebar (User Profile) */}
        <div className="p-4 border-t border-border/60 bg-surface-hover/30 shrink-0 space-y-3 pb-safe">
          <button
            onClick={onOpenFinanceiro}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest">Financeiro</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-full bg-surface border-2 border-border/60 flex items-center justify-center text-text-main font-black text-sm shadow-sm overflow-hidden shrink-0">
               {user?.fotoUrl ? (
                  <img src={user.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
               ) : (
                  user?.nome?.charAt(0) || 'U'
               )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-black text-text-main truncate leading-tight">{user?.nome}</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider truncate mt-0.5">{user?.role || 'Acesso Restrito'}</p>
            </div>
            <Button variant="ghost" onClick={onLogout} className="!p-2 w-10 h-10 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

// --- COMPONENTE PRINCIPAL (ORQUESTRADOR) ---

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [financeiroAberto, setFinanceiroAberto] = useState(false);
  
  const { logout, user } = useAuth();
  const { data: veiculos } = useVeiculos();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  return (
    <div className="flex h-[100dvh] bg-background w-full overflow-hidden selection:bg-primary/20 selection:text-primary">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
        onLogout={() => setIsLogoutModalOpen(true)}
        onOpenFinanceiro={() => setFinanceiroAberto(true)}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background custom-scrollbar scroll-smooth relative flex flex-col">
            
            {/* Header Mobile (Aparece só em < lg) */}
            <header className="lg:hidden flex items-center justify-between px-4 h-[72px] bg-surface/90 backdrop-blur-xl sticky top-0 z-30 border-b border-border/60 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-text-main hover:bg-surface-hover rounded-xl active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                       <span className="font-black text-lg text-text-main tracking-tight">FROTA<span className="text-primary">PRO</span></span>
                    </div>
                </div>
                
                {/* Avatar Mobile */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-inner overflow-hidden">
                    {user?.fotoUrl ? (
                        <img src={user.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                        user?.nome?.charAt(0) || 'U'
                    )}
                </div>
            </header>

            {/* Conteúdo das Páginas (Outlet) */}
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-32">
                <Outlet />
            </div>
        </main>
      </div>

      {/* Modais Globais */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Encerrar Sessão"
        description="Tem a certeza que deseja fechar a sua sessão e sair do sistema?"
        confirmLabel="Sair de Forma Segura"
        variant="danger"
      />

      {financeiroAberto && veiculos && (
        <ModalRelatorioFinanceiro onClose={() => setFinanceiroAberto(false)} veiculos={veiculos} />
      )}
    </div>
  );
}