import { useState, useMemo } from 'react';
import { Fuel, History, FileText, Info, LogOut, Play, Navigation } from 'lucide-react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoJornadas } from './HistoricoJornadas';
import { GestaoDocumentos } from './GestaoDocumentos'; 
import { PageHeader } from './ui/PageHeader';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
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

  // 📡 BUSCA DOS DADOS
  const { data: usuarios = [] } = useUsuarios();
  const { data: veiculos = [] } = useVeiculos();
  const { data: jornadasAtivas = [], refetch: refetchJornadas } = useJornadasAtivas();

  // 🛡️ FILTRO BLINDADO (Resolve o erro de voltar para "Iniciar")
  // Forçamos o tipo como 'any' no filtro para permitir checar 'operadorId' sem erro de TS,
  // já que o seu backend pode estar enviando o campo na raiz do objeto.
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      <PageHeader 
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
              {user.fotoUrl ? (
                <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-lg">{user.nome?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span>Olá, {user.nome.split(' ')[0]}!</span>
          </div>
        }
        subtitle={tenhoJornadaAtiva ? "Você tem uma jornada em andamento." : "Selecione uma ação para começar."}
        extraAction={
          <Button 
            variant="ghost" 
            onClick={logout} 
            className="text-error hover:bg-error/10 h-10"
            icon={<LogOut className="w-4 h-4" />}
          >
            Sair
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OPERAÇÃO */}
        <div className="lg:col-span-2 space-y-6">
          {!tenhoJornadaAtiva ? (
            <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
              <Navigation className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/5 -rotate-12" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-primary text-white rounded-xl shadow-md">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main">Iniciar Nova Jornada</h3>
                    <p className="text-sm text-text-secondary">Escolha o veículo para começar o turno.</p>
                  </div>
                </div>

                {/* ✅ RE-ADICIONADAS AS PROPS QUE O SEU INICIARJORNADA.TSX EXIGE */}
                <IniciarJornada
                  usuarios={usuarios}
                  veiculos={veiculos}
                  operadorLogadoId={user.id}
                  onJornadaIniciada={() => refetchJornadas()}
                  jornadasAtivas={jornadasAtivas}
                />
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-success uppercase tracking-widest bg-success/10 py-2 px-4 rounded-full w-fit border border-success/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                Veículo em Operação
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

        {/* MENU RÁPIDO */}
        <div className="space-y-4">
          <button
            onClick={() => setModalAbastecimentoOpen(true)}
            className="w-full flex items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md hover:border-warning-500/50 transition-all text-left"
          >
            <div className="p-3 bg-warning-500/10 text-warning-600 rounded-lg">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-bold text-text-main">Abastecer</span>
              <span className="text-xs text-text-secondary">Lançar diesel ou arla</span>
            </div>
          </button>

          <button
            onClick={() => setModalDocumentosOpen(true)}
            className="w-full flex items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md hover:border-sky-500/50 transition-all text-left"
          >
            <div className="p-3 bg-sky-500/10 text-sky-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-bold text-text-main">Documentos</span>
              <span className="text-xs text-text-secondary">CRLV e CNH</span>
            </div>
          </button>

          <button
            onClick={() => setModalHistoricoOpen(true)}
            className="w-full flex items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md hover:border-purple-500/50 transition-all text-left"
          >
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
              <History className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-bold text-text-main">Histórico</span>
              <span className="text-xs text-text-secondary">Ver viagens anteriores</span>
            </div>
          </button>
        </div>
      </div>

      {/* MODAIS */}
      <Modal
        isOpen={modalAbastecimentoOpen}
        onClose={() => setModalAbastecimentoOpen(false)}
        title="Novo Abastecimento"
        className="max-w-2xl"
      >
        <FormRegistrarAbastecimento
          usuarioLogado={user}
          veiculoPreSelecionadoId={veiculoEmUsoId}
          onCancelar={() => setModalAbastecimentoOpen(false)}
          onSuccess={() => setModalAbastecimentoOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={modalHistoricoOpen}
        onClose={() => setModalHistoricoOpen(false)}
        title="Meu Histórico"
        className="max-w-5xl"
      >
        <HistoricoJornadas userRole={user.role} />
      </Modal>

      <Modal
        isOpen={modalDocumentosOpen}
        onClose={() => setModalDocumentosOpen(false)}
        title="Documentos"
        className="max-w-4xl"
      >
        {veiculoEmUsoId ? (
          <GestaoDocumentos veiculoId={veiculoEmUsoId} somenteLeitura={true} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="w-8 h-8 text-text-muted mb-3" />
            <h3 className="text-lg font-bold text-text-main">Sem veículo em uso</h3>
            <p className="text-text-secondary text-sm">Inicie uma jornada para ver os documentos.</p>
          </div>
        )}
      </Modal>

    </div>
  );
}