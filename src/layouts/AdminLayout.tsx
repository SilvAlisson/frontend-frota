import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, BarChart3, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVeiculos } from '../hooks/useVeiculos';
import { ConfirmModal } from '../components/ui/ConfirmModal'; 
import { ModalRelatorioFinanceiro } from '../components/ModalRelatorioFinanceiro';
import { Button } from '../components/ui/Button';
import { MENU_ITEMS } from '../config/navigation'; // [NOVO] Importação da configuração

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

  const baseClasses = "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full";
  const mobileClasses = isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full";

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`${baseClasses} ${mobileClasses}`}>
        {/* Header da Sidebar */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border shrink-0 bg-surface/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
              K
            </div>
            <div>
              <span className="block font-bold text-sm text-text-main tracking-tight leading-none">FROTA <span className="text-primary">KLIN</span></span>
              <span className="block text-[10px] text-text-secondary font-medium uppercase tracking-wider mt-0.5">Gestão Pro</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegação (Scrollável) */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {MENU_ITEMS.map((group, idx) => (
            <div key={idx}>
              <h4 className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 opacity-80">
                {group.title}
              </h4>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.path === '/admin' 
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden
                        ${isActive 
                          ? 'bg-primary/10 text-primary font-bold shadow-sm' 
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'
                        }
                        ${item.highlight && !isActive ? 'border border-primary/20 bg-surface-hover text-primary' : 'border border-transparent'}
                      `}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                      <span className="truncate flex-1">{item.label}</span>
                      {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Rodapé da Sidebar (User Profile) */}
        <div className="p-4 border-t border-border bg-surface-hover/30 shrink-0 space-y-3 safe-area-bottom">
          <button
            onClick={onOpenFinanceiro}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-700 hover:from-emerald-500/20 transition-all border border-emerald-500/20 group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-bold">Relatório Financeiro</span>
            </div>
            <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary font-bold text-xs shadow-sm">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-text-main truncate">{user?.nome}</p>
              <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" onClick={onLogout} className="h-8 w-8 p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-lg">
              <LogOut className="w-4 h-4" />
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
    // Estrutura GRID: [Sidebar Fixa] + [Conteúdo Flexível]
    <div className="flex h-[100dvh] bg-background w-full overflow-hidden">
      
      {/* Sidebar Componentizada */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
        onLogout={() => setIsLogoutModalOpen(true)}
        onOpenFinanceiro={() => setFinanceiroAberto(true)}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Header Mobile (Rola junto com o conteúdo para liberar espaço) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background custom-scrollbar scroll-smooth relative">
            
            {/* Header Mobile (Aparece só em < lg) */}
            <header className="lg:hidden flex items-center justify-between p-4 bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-border shadow-sm mb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-text-main hover:bg-surface-hover rounded-lg active:scale-95 transition-transform"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-primary tracking-tight">FrotaManager</span>
                </div>
                {/* Avatar Mobile */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20">
                    {user?.nome?.charAt(0)}
                </div>
            </header>

            {/* Conteúdo das Páginas (Outlet) */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 animate-enter">
                <Outlet />
            </div>
        </main>
      </div>

      {/* Modais Globais */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sair do Sistema"
        description="Tem certeza que deseja encerrar sua sessão atual?"
        confirmLabel="Sair"
        variant="danger"
      />

      {financeiroAberto && veiculos && (
        <ModalRelatorioFinanceiro onClose={() => setFinanceiroAberto(false)} veiculos={veiculos} />
      )}
    </div>
  );
}