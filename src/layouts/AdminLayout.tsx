import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Truck, Wrench, BarChart3, Users, 
  LogOut, LayoutDashboard, FileText,
  Fuel, ClipboardList, AlertTriangle, Medal, Package,
  FileBadge
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVeiculos } from '../hooks/useVeiculos';
import { ConfirmModal } from '../components/ui/ConfirmModal'; 
import { ModalRelatorioFinanceiro } from '../components/ModalRelatorioFinanceiro';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [financeiroAberto, setFinanceiroAberto] = useState(false);
  
  const { logout, user } = useAuth();
  const { data: veiculos } = useVeiculos();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  const menuGroups = [
    {
      title: 'Visão Geral',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: AlertTriangle, label: 'Alertas', path: '/admin/alertas' },
        { icon: Medal, label: 'Ranking', path: '/admin/ranking' },
      ]
    },
    {
      title: 'Operacional',
      items: [
        { icon: Wrench, label: 'Nova Manutenção', path: '/admin/manutencoes/nova', highlight: true },
        { icon: Fuel, label: 'Novo Abastecimento', path: '/admin/abastecimentos/novo', highlight: true },
        { icon: ClipboardList, label: 'Hist. Manutenções', path: '/admin/manutencoes' },
        { icon: Fuel, label: 'Hist. Abastecimentos', path: '/admin/abastecimentos' },
        { icon: Truck, label: 'Hist. Jornadas', path: '/admin/jornadas' },
        { icon: FileText, label: 'Planos Preventivos', path: '/admin/planos' },
      ]
    },
    {
      title: 'Cadastros',
      items: [
        { icon: Truck, label: 'Veículos', path: '/admin/veiculos' },
        { icon: Users, label: 'Equipe', path: '/admin/usuarios' },
        { icon: FileBadge, label: 'Documentos Legais', path: '/admin/documentos' },
        { icon: Package, label: 'Produtos/Serviços', path: '/admin/produtos' },
        { icon: Users, label: 'Fornecedores', path: '/admin/fornecedores' },
      ]
    }
  ];

  const NavItem = ({ item }: { item: any }) => {
    const isActive = item.path === '/admin' 
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.path);

    return (
      <Link
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm font-medium
          ${isActive 
            ? 'bg-primary/10 text-primary font-bold shadow-sm' 
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'
          }
          ${item.highlight && !isActive ? 'border border-primary/20 bg-surface-hover' : 'border border-transparent'}
        `}
      >
        <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
        <span className="tracking-tight truncate">{item.label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface">
      <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold shadow-button">
            K
          </div>
          <div className="leading-none">
            <span className="block font-bold text-sm text-text-main tracking-tight">FROTA <span className="text-primary">KLIN</span></span>
            <span className="block text-[10px] text-text-muted font-medium uppercase tracking-wider mt-0.5">Gestão Inteligente</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h4 className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border bg-surface-hover/30 shrink-0 space-y-2 safe-area-bottom">
        <button
          onClick={() => setFinanceiroAberto(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 group"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-bold">Relatório Financeiro</span>
        </button>

        <div className="pt-2 flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shrink-0">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-text-main truncate">{user?.nome}</p>
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-[10px] text-text-muted hover:text-error flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3 h-3" /> Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    // [MODIFICAÇÃO 1] h-[100dvh] garante que o app ocupe a altura real visível no celular, sem cortar.
    <div className="flex h-[100dvh] bg-background font-sans text-text-main overflow-hidden w-full">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 border-r border-border z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* HEADER MOBILE */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-4 transition-all">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-text-secondary hover:bg-surface-hover rounded-lg active:scale-95 transition-transform"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-base text-text-main">FROTA <span className="text-primary">KLIN</span></span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20">
          {user?.nome?.charAt(0)}
        </div>
      </header>

      {/* DRAWER MOBILE (MENU LATERAL) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-2xl border-r border-border animate-in slide-in-from-left duration-300 flex flex-col">
             <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main z-50"
             >
                <X className="w-6 h-6" />
             </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL (ÁREA DA DIREITA) */}
      <main className="flex-1 lg:ml-64 flex flex-col h-full pt-16 lg:pt-0 transition-all duration-300 w-full">
        
        {/* Wrapper de Scroll Inteligente */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background scroll-smooth w-full">
          
          {/* [MODIFICAÇÃO 2] Container Responsivo
              - px-3 no mobile: Margem mínima para aproveitar a tela.
              - max-w-7xl: Limita a largura em telas gigantes (iMac) para não esticar demais.
              - pb-24: Garante que o último item não fique atrás de botões flutuantes ou barras do sistema.
          */}
          <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 animate-enter pb-24">
            <Outlet />
          </div>
        </div>
      </main>

      {/* MODAIS GLOBAIS */}
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