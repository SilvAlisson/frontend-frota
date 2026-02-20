import { useState, useMemo } from 'react';
import { Fuel, History, FileText, Info, LogOut, Play, Navigation } from 'lucide-react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoJornadas } from './HistoricoJornadas';
import { GestaoDocumentos } from './GestaoDocumentos'; 
import { PageHeader } from './ui/PageHeader';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

// Hooks Atômicos
import { useUsuarios } from '../hooks/useUsuarios';
import { useVeiculos } from '../hooks/useVeiculos';
import { useJornadasAtivas } from '../hooks/useJornadasAtivas';

interface DashboardOperadorProps {
  user: User;
}

export function DashboardOperador({ user }: DashboardOperadorProps) {
  const { logout } = useAuth();
  
  const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);

  // 📡 BUSCA DOS DADOS COM CACHE
  const { data: usuarios = [] } = useUsuarios();
  const { data: veiculos = [] } = useVeiculos();
  const { data: jornadasAtivas = [], refetch: refetchJornadas } = useJornadasAtivas();

  // 🛡️ FILTRO BLINDADO
  const minhasJornadas = useMemo(() => {
    return jornadasAtivas.filter((j: any) => 
      j.operador?.id === user.id || 
      j.operadorId === user.id ||
      j.motoristaId === user.id
    );
  }, [jornadasAtivas, user.id]);

  const tenhoJornadaAtiva = minhasJornadas.length > 0;
  const veiculoEmUsoId = tenhoJornadaAtiva ? minhasJornadas[0].veiculo?.id : undefined;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
      
      {/* HEADER */}
      <PageHeader 
        title={
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {user.fotoUrl ? (
                <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black text-xl">{user.nome?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-none">
              Olá, {user.nome.split(' ')[0]}!
            </span>
          </div>
        }
        subtitle={
          tenhoJornadaAtiva 
            ? "Em Operação - Você tem uma jornada em andamento." 
            : "Pronto para iniciar? Selecione uma ação abaixo."
        }
        extraAction={
          <Button 
            variant="ghost" 
            onClick={logout} 
            className="text-text-muted hover:text-error hover:bg-error/10 h-12 w-12 p-0 rounded-full transition-colors"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* ÁREA PRINCIPAL: OPERAÇÃO (Lado Esquerdo) */}
        <div className="lg:col-span-8 space-y-6">
          {!tenhoJornadaAtiva ? (
            <div className="bg-gradient-to-br from-primary to-primary-hover rounded-3xl p-6 sm:p-8 shadow-float-primary relative overflow-hidden group">
              <Navigation className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-white/20 text-white rounded-2xl shadow-inner backdrop-blur-sm">
                    <Play className="w-8 h-8 fill-current" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">Iniciar Turno</h3>
                    <p className="text-primary-50 font-medium mt-1 text-sm sm:text-base opacity-90">Vincule-se a um veículo para começar o dia de trabalho.</p>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-5 sm:p-6 shadow-lg border border-border/60">
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
            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-xs font-black text-success uppercase tracking-widest bg-success/10 py-2 px-4 rounded-xl w-fit border border-success/20 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                Veículo Vinculado
              </div>

              {minhasJornadas.map((jornada) => (
                <JornadaCard
                  key={jornada.id}
                  jornada={jornada}
                  onJornadaFinalizada={() => refetchJornadas()}
                />
              ))}
            </div>
          )}
        </div>

        {/* ÁREA DE AÇÕES RÁPIDAS (Lado Direito) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
            <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1 mb-1">Acesso Rápido</h2>
            
            <button
              onClick={() => setModalAbastecimentoOpen(true)}
              className="w-full flex items-center gap-5 bg-surface border border-border/60 p-5 rounded-3xl shadow-sm hover:shadow-float active:scale-[0.98] transition-all text-left group"
            >
              <div className="p-4 bg-warning-500/10 text-warning-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Fuel className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="block font-black text-text-main text-lg tracking-tight mb-0.5">Abastecer</span>
                <span className="text-xs font-bold text-text-secondary opacity-80">Lançar faturas de combustível</span>
              </div>
            </button>

            <button
              onClick={() => setModalDocumentosOpen(true)}
              className="w-full flex items-center gap-5 bg-surface border border-border/60 p-5 rounded-3xl shadow-sm hover:shadow-float active:scale-[0.98] transition-all text-left group"
            >
              <div className="p-4 bg-sky-500/10 text-sky-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="block font-black text-text-main text-lg tracking-tight mb-0.5">Licenças</span>
                <span className="text-xs font-bold text-text-secondary opacity-80">Acesso a CNH e CRLV</span>
              </div>
            </button>

            <button
              onClick={() => setModalHistoricoOpen(true)}
              className="w-full flex items-center gap-5 bg-surface border border-border/60 p-5 rounded-3xl shadow-sm hover:shadow-float active:scale-[0.98] transition-all text-left group"
            >
              <div className="p-4 bg-purple-500/10 text-purple-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                <History className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="block font-black text-text-main text-lg tracking-tight mb-0.5">Histórico</span>
                <span className="text-xs font-bold text-text-secondary opacity-80">Registo de viagens fechadas</span>
              </div>
            </button>
        </div>
      </div>

      {/* MODAIS */}
      <Modal isOpen={modalAbastecimentoOpen} onClose={() => setModalAbastecimentoOpen(false)} title="Novo Abastecimento" className="max-w-2xl">
        <FormRegistrarAbastecimento usuarioLogado={user} veiculoPreSelecionadoId={veiculoEmUsoId} onCancelar={() => setModalAbastecimentoOpen(false)} onSuccess={() => setModalAbastecimentoOpen(false)} />
      </Modal>

      <Modal isOpen={modalHistoricoOpen} onClose={() => setModalHistoricoOpen(false)} title="Meu Histórico de Viagens" className="max-w-5xl">
        <HistoricoJornadas userRole={user.role} />
      </Modal>

      <Modal isOpen={modalDocumentosOpen} onClose={() => setModalDocumentosOpen(false)} title="Pasta de Documentos" className="max-w-4xl">
        {veiculoEmUsoId ? (
          <GestaoDocumentos veiculoId={veiculoEmUsoId} somenteLeitura={true} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-hover/30 rounded-3xl border-2 border-dashed border-border/60 shadow-inner">
            <Info className="w-12 h-12 text-warning-500 mb-4 opacity-50" />
            <h3 className="text-lg font-black text-text-main uppercase tracking-widest">Veículo Não Vinculado</h3>
            <p className="text-text-secondary text-sm font-medium mt-2 max-w-xs mx-auto">Inicie um turno de trabalho para conseguir aceder aos documentos do veículo em uso.</p>
          </div>
        )}
      </Modal>

    </div>
  );
}