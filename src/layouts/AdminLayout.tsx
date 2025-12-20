import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// Ícones SVG minimalistas
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

export function AdminLayout() {
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    // Lógica de navegação segura
    const goTo = (path: string) => {
        navigate(path);
        setMenuMobileAberto(false);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full text-white">
            {/* LOGO AREA */}
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">
                    K
                </div>
                <div>
                    <span className="block font-bold text-lg tracking-wide">FROTA KLIN</span>
                    <span className="block text-[10px] text-gray-300 uppercase tracking-widest">Gestão Inteligente</span>
                </div>
            </div>

            {/* MENU LINKS */}
            <div className="space-y-8 flex-1">
                <MenuSection title="Visão Geral">
                    <MenuButton active={isActive('/admin')} onClick={() => goTo('/admin')} icon="📊" label="Dashboard" />
                    <MenuButton active={isActive('/admin/alertas')} onClick={() => goTo('/admin/alertas')} icon="🔔" label="Alertas" />
                </MenuSection>

                <MenuSection title="Operacional">
                    <MenuButton active={isActive('/admin/manutencoes')} onClick={() => goTo('/admin/manutencoes')} icon="🔧" label="Manutenções" />
                    <MenuButton active={isActive('/admin/abastecimentos')} onClick={() => goTo('/admin/abastecimentos')} icon="⛽" label="Abastecimentos" />
                    <MenuButton active={isActive('/admin/jornadas')} onClick={() => goTo('/admin/jornadas')} icon="🚚" label="Jornadas" />
                </MenuSection>

                <MenuSection title="Cadastros">
                    <MenuButton active={isActive('/admin/veiculos')} onClick={() => goTo('/admin/veiculos')} icon="🚛" label="Veículos" />
                    <MenuButton active={isActive('/admin/usuarios')} onClick={() => goTo('/admin/usuarios')} icon="👥" label="Equipe" />
                </MenuSection>
            </div>

            {/* FOOTER DO MENU */}
            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 px-2 opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">AD</div>
                    <div className="text-sm">
                        <p className="font-medium">Admin User</p>
                        <p className="text-xs text-gray-400">Sair do sistema</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden relative font-sans">

            {/* SIDEBAR DESKTOP (Azul Escuro - Cor Secundária) */}
            <aside className="hidden md:flex w-72 bg-secondary flex-col py-8 px-6 shrink-0 h-full overflow-y-auto shadow-2xl z-10">
                <SidebarContent />
            </aside>

            {/* HEADER MOBILE (Branco para limpeza visual) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border z-40 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold">
                    KLIN FROTA
                </div>
                <button onClick={() => setMenuMobileAberto(true)} className="p-2 text-primary hover:bg-background rounded-lg">
                    <MenuIcon />
                </button>
            </div>

            {/* DRAWER MOBILE */}
            {menuMobileAberto && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-secondary/90 backdrop-blur-sm transition-opacity" onClick={() => setMenuMobileAberto(false)} />
                    <aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-secondary shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setMenuMobileAberto(false)} className="text-white/70 hover:text-white"><CloseIcon /></button>
                        </div>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* ÁREA DE CONTEÚDO (Branco Gelo) */}
            <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 pt-20 md:pt-8 w-full">
                <div className="max-w-7xl mx-auto min-h-full pb-10 animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// Subcomponentes de Menu
const MenuSection = ({ title, children }: any) => (
    <div className="mb-6">
        <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2 text-white/40 font-sans">
            {title}
        </h4>
        <div className="space-y-1">{children}</div>
    </div>
);

const MenuButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group
        ${active
                ? 'bg-accent text-white shadow-lg shadow-black/20 font-semibold translate-x-1'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'}
      `}
    >
        <span className={`text-lg opacity-80 ${active ? 'scale-110' : ''}`}>{icon}</span>
        <span className="text-sm">{label}</span>
    </button>
);