import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Fuel, History, FileText, Info, LogOut, Play, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { FormRegistrarDefeito } from './forms/FormRegistrarDefeito';
import { HistoricoJornadas } from './HistoricoJornadas';
import { GestaoDocumentos } from './GestaoDocumentos';
import { Modal } from './ui/Modal';

import { EmptyState } from './ui/EmptyState';
import { Avatar } from './ui/Avatar';
import { SmartFAB } from './ui/SmartFAB';
import { Skeleton } from './ui/Skeleton';
import confetti from 'canvas-confetti';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import type { User } from '../types';
import { cn } from '../lib/utils';

// Hooks Atômicos
import { useUsuarios } from '../hooks/useUsuarios';
import { useVeiculos } from '../hooks/useVeiculos';
import { useJornadasAtivas } from '../hooks/useJornadasAtivas';
import { useHaptics } from '../hooks/useHaptics';

interface DashboardOperadorProps {
 user: User;
}

// ─── BOTTOM NAV ITEM ─────────────────────────────────────────────────────────
interface BottomNavItemProps {
 icon: React.ElementType;
 label: string;
 onClick: () => void;
 accent?: 'yellow' | 'red' | 'sky' | 'purple';
 badge?: boolean;
}

function BottomNavItem({ icon: Icon, label, onClick, accent = 'yellow', badge = false }: BottomNavItemProps) {
 const { vibrateLight } = useHaptics();
 const accentMap = {
  yellow: 'text-warning-600 dark:text-warning bg-warning/10 group-active:bg-warning/20',
  red: 'text-error bg-error/10 group-active:bg-error/20',
  sky: 'text-info bg-info/10 group-active:bg-info/20',
  purple: 'text-primary bg-primary/10 group-active:bg-primary/20',
 };

 const handleClick = () => {
  vibrateLight();
  onClick();
 };

 return (
  <Button
   variant="ghost"
   onClick={handleClick}
   className="group relative flex flex-col items-center justify-center gap-1 flex-1 h-full touch-target transition-all active:scale-95 hover:bg-transparent !p-0 focus-ring rounded-xl"
   aria-label={label}
  >
   <div className={cn(
    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border border-transparent",
    accentMap[accent]
   )}>
    <Icon className="w-5 h-5" />
   </div>
   <span className="text-[9px] font-black uppercase tracking-widest text-text-muted leading-none">{label}</span>

    {badge && (
     <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-error animate-pulse border-2 border-background" />
    )}
  </Button>
 );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function DashboardOperador({ user }: DashboardOperadorProps) {
 const { logout } = useAuth();
 const { theme, toggleTheme } = useTheme();
 const { vibrateLight, vibrateMedium, vibrateSuccess } = useHaptics();

 const [isRefreshing, setIsRefreshing] = useState(false);

 const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);
 const [modalDefeitoOpen, setModalDefeitoOpen] = useState(false);
 const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
 const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);

 // 📡 BUSCA DOS DADOS COM CACHE
 const { usuarios = [], refetch: refetchUsuarios, isLoading: loadingUsuarios } = useUsuarios();
 const { data: veiculos = [], refetch: refetchVeiculos, isLoading: loadingVeiculos } = useVeiculos();
 const { data: jornadasAtivas = [], refetch: refetchJornadas, isLoading: loadingJornadas } = useJornadasAtivas();

 const isInitialLoading = loadingUsuarios || loadingVeiculos || loadingJornadas;

 const handleManualRefresh = async () => {
  vibrateLight();
  setIsRefreshing(true);
  await Promise.all([refetchUsuarios(), refetchVeiculos(), refetchJornadas()]);
  vibrateSuccess();
  setTimeout(() => setIsRefreshing(false), 800);
 };

 const handleJornadaFinalizada = async () => {
  confetti({
   particleCount: 150,
   spread: 70,
   origin: { y: 0.6 },
   colors: ['#10B981', '#06B6D4', '#3B82F6'], // Success, Primary, Secondary
   zIndex: 9999
  });
  vibrateSuccess();
  await refetchJornadas();
 };

 // 🛡️ FILTRO BLINDADO — só minhas jornadas
 const minhasJornadas = useMemo(() => {
  const result = jornadasAtivas.filter((j) =>
   j.operador?.id === user.id
  );
  return result;
 }, [jornadasAtivas, user.id]);

 const tenhoJornadaAtiva = minhasJornadas.length > 0;
 const veiculoEmUsoId = tenhoJornadaAtiva ? minhasJornadas[0].veiculo?.id : undefined;

 return (
  <div className="min-h-screen -mx-4 sm:-mx-8 px-0 relative overflow-hidden bg-background transition-colors duration-500 font-sans">

   {/* ─── HEADER MOBILE CLEAN ──────────────────────────────────────────── */}
   <header className="sticky top-0 z-40 px-4 sm:px-8 py-3 glass-premium border-b-0 border-border/30">
    <div className="max-w-2xl mx-auto flex justify-between items-center">

     <div className="flex items-center gap-3">
      {/* ✨ MUDANÇA AQUI: Avatar envolvido no Link */}
      <Link
       to="/minha-conta"
       title="Acessar Minha Conta e Biometria"
       className="w-11 h-11 rounded-full p-0.5 shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
      >
       <Avatar url={user.fotoUrl} nome={user.nome} className="w-10 h-10 border-none shadow-none cursor-pointer" />
      </Link>
      <div className="leading-tight">
       <h1 className="font-header text-base sm:text-lg font-black text-text-main tracking-tight">
        Olá, <span className="text-primary">{user.nome.split(' ')[0]}</span>
       </h1>
       <p className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
        {tenhoJornadaAtiva ? (
         <><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /><span className="text-success">Em Operação</span></>
        ) : (
         <><span className="w-1.5 h-1.5 rounded-full bg-text-muted" /><span className="text-text-muted">Disponível</span></>
        )}
       </p>
      </div>
     </div>

     <div className="flex items-center gap-2">
      {/* BOTÃO REFRESH MANUAL */}
      <Button
       variant="ghost"
       size="icon"
       onClick={handleManualRefresh}
       disabled={isRefreshing}
       className="w-11 h-11 touch-target rounded-xl bg-surface/50 border border-border/40 hover:bg-surface flex items-center justify-center text-text-muted transition-all active:scale-90 focus-ring"
       aria-label="Atualizar Dados"
      >
       <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
      </Button>

      <Button
       variant="ghost"
       size="icon"
       onClick={() => {
        vibrateLight();
        toggleTheme();
       }}
       className="w-11 h-11 touch-target rounded-xl bg-surface/50 border border-border/40 hover:bg-surface flex items-center justify-center text-text-muted transition-all focus-ring"
       aria-label="Alterar Tema"
      >
       {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </Button>

      <Button
       variant="ghost"
       size="icon"
       onClick={async () => {
        vibrateMedium();
        await logout();
       }}
       className="w-11 h-11 touch-target rounded-xl bg-error/5 border border-error/10 hover:bg-error/20 flex items-center justify-center text-error transition-all hover:rotate-12 focus-ring"
       aria-label="Sair"
      >
       <LogOut className="w-4 h-4" />
      </Button>
     </div>

    </div>
   </header>

   {/* ─── ÁREA PRINCIPAL ────────────────────────────────────────────────── */}
   <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-6 pb-32 lg:pb-10 space-y-6 @container">

    {isInitialLoading ? (
     <div className="space-y-6 animate-in fade-in duration-500">
       <Skeleton className="h-[280px] w-full rounded-[2rem]" />
       <div className="grid grid-cols-2 gap-4">
         <Skeleton className="h-[100px] w-full rounded-[2rem]" />
         <Skeleton className="h-[100px] w-full rounded-[2rem]" />
       </div>
     </div>
    ) : (
     <>
      {/* === BLOCO DE JORNADA === */}
      {!tenhoJornadaAtiva ? (
       <div className="bg-gradient-to-br from-primary to-primary-hover rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-10px_rgba(var(--color-primary),0.5)] relative overflow-hidden group">
        <Navigation className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
         <div className="flex items-start gap-4">
          <div className="p-4 bg-white/20 text-white rounded-2xl shadow-inner backdrop-blur-sm border border-white/20">
           <Play className="w-7 h-7 fill-current" />
          </div>
          <div className="text-white">
           <h2 className="font-header text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm">Iniciar Turno</h2>
           <p className="text-white/80 font-medium mt-1 text-sm">
            Selecione a placa do <strong>veículo</strong> para começar o trabalho.
           </p>
          </div>
         </div>

         <div className="glass-premium rounded-[2rem] p-4 sm:p-6 shadow-lg border-0 border-white/5">
          <IniciarJornada
           usuarios={usuarios}
           veiculos={veiculos}
           operadorLogadoId={user.id}
           onJornadaIniciada={() => refetchJornadas()}
           jornadasAtivas={jornadasAtivas}
          />
         </div>
        </div>
       </div>
      ) : (
       <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 text-xs font-black text-success uppercase tracking-widest bg-success/10 py-2 px-4 rounded-xl w-fit border border-success/20 shadow-sm">
         <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
         </span>
         Veículo Vinculado
        </div>

        {minhasJornadas.map((jornada) => (
         <JornadaCard
          key={jornada.id}
          jornada={jornada}
          onJornadaFinalizada={handleJornadaFinalizada}
         />
        ))}
       </div>
      )}

      {/* === ACESSO RÁPIDO (Visível apenas em DESKTOP) === */}
      <div className="hidden lg:grid @max-md:grid-cols-1 @md:grid-cols-2 gap-4 pt-2">
       <h2 className="lg:col-span-2 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
        Acesso Rápido
       </h2>

       {[
        { icon: Fuel, label: 'Abastecimento', sub: 'Lançar combustível ou aditivo', accent: 'text-warning-600 dark:text-warning bg-warning/10', border: 'hover:border-warning/30', onClick: () => setModalAbastecimentoOpen(true) },
        { icon: AlertTriangle, label: 'Reportar Defeito', sub: 'Problema no veículo? Envie para a base', accent: 'text-error bg-error/10', border: 'hover:border-error/30', onClick: () => setModalDefeitoOpen(true) },
        { icon: FileText, label: 'Licenças', sub: 'Documentos legais KLIN e ASTs', accent: 'text-info bg-info/10', border: 'hover:border-info/30', onClick: () => setModalDocumentosOpen(true) },
        { icon: History, label: 'Histórico', sub: 'Registro pessoal de turnos anteriores', accent: 'text-primary bg-primary/10', border: 'hover:border-primary/30', onClick: () => setModalHistoricoOpen(true) },
       ].map(({ icon: Icon, label, sub, accent, border, onClick }) => (
        <Button
         variant="ghost"
         key={label}
         onClick={() => {
          vibrateLight();
          onClick();
         }}
         className={cn(
          "flex h-auto items-center gap-4 glass-premium border border-border/20 p-5 rounded-[2rem] shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left group focus-ring touch-target !justify-start !whitespace-normal",
          border
         )}
        >
         <div className={cn("p-3.5 rounded-2xl border border-transparent shadow-inner group-hover:scale-110 transition-transform duration-300", accent)}>
          <Icon className="w-6 h-6" />
         </div>
         <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="block font-black text-text-main tracking-tight mb-0.5 truncate">{label}</span>
          <span className="block text-xs font-bold text-text-secondary opacity-80 truncate">{sub}</span>
         </div>
        </Button>
       ))}
      </div>
     </>
    )}
   </main>

   {/* ─── BOTTOM NAVIGATION BAR (Mobile) ────────────────────────── */}
   <nav
    className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-premium border-t-0 border-t-border/30 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] safe-bottom"
    aria-label="Navegação principal"
   >
    <div className="max-w-2xl mx-auto flex items-center justify-around h-20 px-2">
     <BottomNavItem icon={Fuel} label="Abastecer" accent="yellow" onClick={() => setModalAbastecimentoOpen(true)} />
     <BottomNavItem icon={AlertTriangle} label="Defeito" accent="red" badge={false} onClick={() => setModalDefeitoOpen(true)} />
     <BottomNavItem icon={FileText} label="Licenças" accent="sky" onClick={() => setModalDocumentosOpen(true)} />
     <BottomNavItem icon={History} label="Histórico" accent="purple" onClick={() => setModalHistoricoOpen(true)} />
    </div>
   </nav>

   {/* ─── MODAIS ───────────────────────────────────────────────────────── */}
   <Modal isOpen={modalAbastecimentoOpen} onClose={() => setModalAbastecimentoOpen(false)} title="Novo Abastecimento" className="max-w-2xl">
    <div className="p-2">
     <FormRegistrarAbastecimento usuarioLogado={user} veiculoPreSelecionadoId={veiculoEmUsoId} onCancelar={() => setModalAbastecimentoOpen(false)} onSuccess={() => setModalAbastecimentoOpen(false)} />
    </div>
   </Modal>

   <Modal isOpen={modalDefeitoOpen} onClose={() => setModalDefeitoOpen(false)} title="Comunicação de Defeito" className="max-w-xl">
    <div className="p-2 sm:p-4">
     <FormRegistrarDefeito veiculoId={veiculoEmUsoId} veiculosDisponiveis={veiculos} onCancel={() => setModalDefeitoOpen(false)} onSuccess={() => setModalDefeitoOpen(false)} />
    </div>
   </Modal>

   <Modal isOpen={modalHistoricoOpen} onClose={() => setModalHistoricoOpen(false)} title="Meu Histórico de Viagens" className="max-w-5xl">
    <HistoricoJornadas userRole={user.role} isReadOnly={true} />
   </Modal>

   <Modal isOpen={modalDocumentosOpen} onClose={() => setModalDocumentosOpen(false)} title="Pasta de Documentos" className="max-w-4xl">
    {veiculoEmUsoId ? (
     <GestaoDocumentos veiculoId={veiculoEmUsoId} somenteLeitura={true} />
    ) : (
     <div className="pt-6 pb-2">
      <EmptyState icon={Info} title="Veículo Não Vinculado" description="Inicie um turno de trabalho para conseguir acessar os documentos do veículo em uso." />
     </div>
    )}
   </Modal>

  </div>
 );
}