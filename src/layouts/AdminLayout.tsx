import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ModalRelatorioFinanceiro } from '../components/ModalRelatorioFinanceiro';
import { useVeiculos } from '../hooks/useVeiculos';

// Ícones SVG minimalistas
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

export function AdminLayout() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [financeiroAberto, setFinanceiroAberto] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const { user, logout } = useAuth();
    const { data: veiculos } = useVeiculos();

    const isActive = (path: string) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        return location.pathname === path;
    };

    const goTo = (path: string) => {
        navigate(path);
        setMenuMobileAberto(false);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full text-white">
            {/* LOGO */}
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">
                    K
                </div>
                <div>
                    <span className="block font-bold text-lg tracking-wide">FROTA KLIN</span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Gestão Inteligente</span>
                </div>
            </div>

            {/* MENU SCROLLÁVEL */}
            <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                <MenuSection title="Visão Geral">
                    <MenuButton active={isActive('/admin')} onClick={() => goTo('/admin')} icon="📊" label="Dashboard" />
                    <MenuButton active={isActive('/admin/alertas')} onClick={() => goTo('/admin/alertas')} icon="🔔" label="Alertas" />
                    <MenuButton active={isActive('/admin/ranking')} onClick={() => goTo('/admin/ranking')} icon="🏆" label="Ranking" />
                </MenuSection>

                <MenuSection title="Operacional">
                    <MenuButton active={isActive('/admin/manutencoes/nova')} onClick={() => goTo('/admin/manutencoes/nova')} icon="🔧" label="Nova Manutenção" highlight />
                    <MenuButton active={isActive('/admin/abastecimentos/novo')} onClick={() => goTo('/admin/abastecimentos/novo')} icon="⛽" label="Novo Abastecimento" highlight />

                    <div className="h-2"></div>

                    <MenuButton active={isActive('/admin/manutencoes')} onClick={() => goTo('/admin/manutencoes')} icon="📋" label="Hist. Manutenções" small />
                    <MenuButton active={isActive('/admin/abastecimentos')} onClick={() => goTo('/admin/abastecimentos')} icon="📋" label="Hist. Abastecimentos" small />
                    <MenuButton active={isActive('/admin/jornadas')} onClick={() => goTo('/admin/jornadas')} icon="🚚" label="Hist. Jornadas" small />
                    <MenuButton active={isActive('/admin/planos')} onClick={() => goTo('/admin/planos')} icon="📅" label="Planos Preventivos" small />
                </MenuSection>

                <MenuSection title="Cadastros">
                    <MenuButton active={isActive('/admin/veiculos')} onClick={() => goTo('/admin/veiculos')} icon="🚛" label="Veículos" />
                    <MenuButton active={isActive('/admin/usuarios')} onClick={() => goTo('/admin/usuarios')} icon="👥" label="Equipe" />
                    <MenuButton active={isActive('/admin/cargos')} onClick={() => goTo('/admin/cargos')} icon="👔" label="Cargos" />
                    <MenuButton active={isActive('/admin/produtos')} onClick={() => goTo('/admin/produtos')} icon="📦" label="Produtos/Serviços" />
                    <MenuButton active={isActive('/admin/fornecedores')} onClick={() => goTo('/admin/fornecedores')} icon="🤝" label="Fornecedores" />
                </MenuSection>
            </div>

            {/* FOOTER */}
            <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
                <button
                    onClick={() => setFinanceiroAberto(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors border border-emerald-600/30 group"
                >
                    <span className="text-lg">💰</span>
                    <span className="text-sm font-bold">Relatório Financeiro</span>
                </button>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-2 py-1 opacity-80 hover:opacity-100 cursor-pointer transition-opacity text-left group rounded-lg hover:bg-white/5"
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs border border-white/20 group-hover:border-red-400 group-hover:text-red-400 transition-colors shrink-0">
                        {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-sm overflow-hidden flex-1">
                        <p className="font-medium truncate text-white">{user?.nome || 'Usuário'}</p>
                        <p className="text-xs text-slate-400 group-hover:text-red-400 flex items-center gap-1 transition-colors">
                            Sair do sistema
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden relative font-sans">
            {/* SIDEBAR DESKTOP */}
            <aside className="hidden md:flex w-72 bg-slate-900 flex-col py-8 px-6 shrink-0 h-full overflow-y-auto shadow-2xl z-20">
                <SidebarContent />
            </aside>

            {/* HEADER MOBILE */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-40 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold">
                    KLIN FROTA
                </div>
                <button onClick={() => setMenuMobileAberto(true)} className="p-2 text-slate-600 hover:bg-background rounded-lg">
                    <MenuIcon />
                </button>
            </div>

            {/* DRAWER MOBILE */}
            {menuMobileAberto && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setMenuMobileAberto(false)} />
                    <aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-slate-900 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setMenuMobileAberto(false)} className="text-white/70 hover:text-white"><CloseIcon /></button>
                        </div>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* CONTEÚDO */}
            <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 pt-20 md:pt-8 w-full scroll-smooth">
                <div className="max-w-7xl mx-auto min-h-full pb-10 animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>

            {/* MODAL FINANCEIRO */}
            {financeiroAberto && veiculos && (
                <ModalRelatorioFinanceiro onClose={() => setFinanceiroAberto(false)} veiculos={veiculos} />
            )}
        </div>
    );
}

// Subcomponentes
const MenuSection = ({ title, children }: any) => (
    <div className="mb-6">
        <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2 text-slate-500 font-sans">
            {title}
        </h4>
        <div className="space-y-1">{children}</div>
    </div>
);

const MenuButton = ({ active, onClick, icon, label, small, highlight }: any) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group
      ${active
                ? 'bg-primary text-white shadow-lg shadow-black/20 font-semibold translate-x-1'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'}
      ${small ? 'text-xs pl-10 opacity-90' : 'text-sm'}
      ${highlight && !active ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20' : ''}
    `}
    >
        {icon && <span className={`text-lg opacity-80 ${active ? 'scale-110' : ''}`}>{icon}</span>}
        <span className="truncate">{label}</span>
    </button>
);