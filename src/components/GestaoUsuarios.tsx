import { useState } from 'react';
import type { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { DossieIntegrante } from './rh/DossieIntegrante';
import { ModalQrCode } from './ModalQrCode';
import { ModalGerarEtiquetas } from './rh/ModalGerarEtiquetas';
import { exportarParaExcel } from '../utils';
import { TableStyles } from '../styles/table';
import { toast } from 'sonner';
import { EmptyState } from './ui/EmptyState';

function getFirstAndLastName(fullName: string) {
  const parts = fullName.trim().split(' ');
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

import {
  QrCode, Search, Download, Users, Printer, Activity, UserPlus, UserX
} from 'lucide-react';

import { PageHeader } from './ui/PageHeader';
import { PullToRefresh } from './ui/PullToRefresh';

import { useUsuarios } from '../hooks/useUsuarios';
import { useModalStore } from '../hooks/useModalStore';
import { useDebounce } from '../hooks/useDebounce';
import { ConfirmInativar } from './ui/ConfirmInativar';
import { ModalNovoIntegrante } from './rh/ModalNovoIntegrante';
import { useCargos } from '../hooks/useCargos';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function GestaoUsuarios() {
  // Apenas estados de visualização operacional
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('TODOS');
  
  const [usuarioParaInativar, setUsuarioParaInativar] = useState<User | null>(null);
  const [novoIntegranteOpen, setNovoIntegranteOpen] = useState(false);
  const { data: cargos = [] } = useCargos();
  const { user: currentUser } = useAuth();

  const { usuarios, isLoading, refetch } = useUsuarios();
  const { openModal, closeModal } = useModalStore();

  const buscaDebounced = useDebounce(busca, 300);

  // Filtragem Inteligente (Texto + Cargo)
  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = !buscaDebounced || 
      u.nome.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
      u.email.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
      (u.matricula && u.matricula.includes(buscaDebounced));
      
    const matchRole = filtroRole === 'TODOS' || u.role === filtroRole;
    
    return matchBusca && matchRole;
  });

  const handleAbrirQrModal = (user: User) => {
    const modalId = openModal('CUSTOM', {
      content: (
        <ModalQrCode
          user={{ ...user, loginToken: user.loginToken ?? undefined }}
          onClose={() => closeModal(modalId)}
          onUpdate={() => refetch()}
        />
      )
    });
  };

  const handleAbrirEtiquetasModal = () => {
    const modalId = openModal('CUSTOM', {
      content: (
        <ModalGerarEtiquetas
          usuarios={usuarios}
          onClose={() => closeModal(modalId)}
        />
      )
    });
  };

  const handleExportar = () => {
    if (usuarios.length === 0) return;
    const formatRole = (role: string) => {
      const map: Record<string, string> = {
        'ADMIN': 'Administrador', 'ENCARREGADO': 'Encarregado', 'OPERADOR': 'Operador',
        'RH': 'RH', 'COORDENADOR': 'Coordenador', 'AUXILIAR_OPERACIONAL': 'Auxiliar Operacional'
      };
      return map[role] || role;
    };
    const promessa = new Promise((resolve) => {
      const dados = usuarios.map(u => ({
        'Nome': u.nome,
        'Email': u.email,
        'Matrícula': u.matricula || '-',
        'Função': formatRole(u.role)
      }));
      exportarParaExcel(dados, "Equipe_Operacional.xlsx");
      resolve(true);
    });
    toast.promise(promessa, { loading: 'Gerando Arquivo Excel...', success: 'Transferência concluída!', error: 'Erro na exportação.' });
  };

  // --- VISÃO DO DOSSIÊ OPERACIONAL (Histórico de Jornadas e Defeitos) ---
  if (usuarioSelecionado) {
    return (
      <div className="animate-in fade-in duration-500">
        <DossieIntegrante
          userId={usuarioSelecionado.id}
          onClose={() => setUsuarioSelecionado(null)}
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

        <PageHeader
          title="Equipe Operacional"
          subtitle="Visão operacional para gestão de jornadas, anomalias e acesso via QR Code."
          extraAction={
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 items-end mt-4 sm:mt-0">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="bg-surface-hover/50 border-none font-medium"
                  icon={<Search className="w-4 h-4 text-text-muted" />}
                  containerClassName="!mb-0"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                {/* Filtro Rápido de Cargos */}
                <div className="w-48 shrink-0">
                  <Select
                    value={filtroRole}
                    onChange={(e: any) => setFiltroRole(e.target.value)}
                    containerClassName="!mb-0"
                    className="h-11 border border-border/60 bg-surface-hover/50 font-bold"
                    options={[
                      { value: "TODOS", label: "Todos os Cargos" },
                      { value: "OPERADOR", label: "Operadores" },
                      { value: "AUXILIAR_OPERACIONAL", label: "Auxiliares" },
                      { value: "ENCARREGADO", label: "Encarregados" },
                      { value: "COORDENADOR", label: "Coordenadores" },
                      { value: "RH", label: "Equipe RH" },
                      { value: "ADMIN", label: "Administradores" }
                    ]}
                  />
                </div>

                <Button variant="secondary" onClick={handleExportar} className="whitespace-nowrap flex-1 sm:flex-none h-11" icon={<Download className="w-4 h-4" />}>
                  Excel
                </Button>
                <Button variant="secondary" onClick={handleAbrirEtiquetasModal} className="whitespace-nowrap flex-1 sm:flex-none h-11 shadow-sm border-border" icon={<Printer className="w-4 h-4 text-primary" />}>
                  Imprimir QRs
                </Button>
                {currentUser && ['ADMIN', 'RH'].includes(currentUser.role) && (
                  <Button variant="primary" onClick={() => setNovoIntegranteOpen(true)} className="whitespace-nowrap flex-1 sm:flex-none h-11" icon={<UserPlus className="w-4 h-4" />}>
                    Novo Integrante
                  </Button>
                )}
              </div>
            </div>
          }
        />

        {/* LISTAGEM RESPONSIVA */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-surface-hover/50 rounded-2xl animate-pulse border border-border/40" />)}
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <EmptyState
            icon={Users}
            title={busca || filtroRole !== 'TODOS' ? "Nenhum integrante encontrado" : "Equipe Vazia"}
            description={busca || filtroRole !== 'TODOS' ? "Ajuste os filtros ou termos de pesquisa." : "Nenhum usuário cadastrado no sistema."}
          />
        ) : (
          <div className="bg-surface rounded-3xl shadow-sm border border-border/60 overflow-hidden">
            <ListaResponsiva
              itens={usuariosFiltrados}
              emptyMessage=""

              desktopGridCols="grid-cols-[2fr_1fr_1fr]"
              desktopHeader={
                <>
                  <th className={`${TableStyles.th} pl-8 justify-start`}>Integrante</th>
                  <th className={`${TableStyles.th} justify-center`}>Estatuto Operacional</th>
                  <th className={`${TableStyles.th} justify-end pr-8`}>Ações Operacionais</th>
                </>
              }
              renderDesktop={(u) => (
                <>
                  <td className={`${TableStyles.td} pl-8 justify-start`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar nome={u.nome} url={(u as any).fotoUrl || u.image} />
                      <span className="font-bold text-text-main text-base tracking-tight truncate" title={u.nome}>{getFirstAndLastName(u.nome)}</span>
                    </div>
                  </td>
                  <td className={`${TableStyles.td} justify-center`}>
                    <div className="w-full flex flex-col items-center justify-center gap-1.5 text-center">
                      {/* Cargo real (cargo.nome) ou fallback para role */}
                      {u.cargo?.nome ? (
                        <Badge variant="info" className="shadow-sm">
                          {u.cargo.nome}
                        </Badge>
                      ) : (
                        <BadgeRole role={u.role} />
                      )}

                      {/* Role do sistema como subtítulo (menor) se for diferente do cargo */}
                      {u.cargo?.nome && u.cargo.nome.toUpperCase() !== u.role.replace('_', ' ') && (
                        <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider bg-surface-hover px-1.5 py-0.5 rounded border border-border/50">
                          Permissão: {u.role.replace('_', ' ')}
                        </span>
                      )}

                      {u.matricula && <span className="text-[10px] text-text-muted font-mono font-bold uppercase tracking-widest bg-surface-hover px-1.5 py-0.5 rounded border border-border/50 block w-fit truncate">ID: {u.matricula}</span>}
                    </div>
                  </td>
                  <td className={`${TableStyles.td} justify-end pr-8`}>
                    <div className="grid grid-cols-2 gap-1.5 w-fit ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                      
                      {/* Botão focado no Histórico do Integrante */}
                      <Button variant="ghost" className="h-11 w-11 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => setUsuarioSelecionado(u)} title="Ver Histórico Operacional" aria-label={`Ver histórico de ${u.nome}`}>
                        <Activity className="w-5 h-5" />
                      </Button>

                      {/* QR Code apenas para quem atua no pátio/campo */}
                      {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO' || u.role === 'AUXILIAR_OPERACIONAL') ? (
                        <Button variant="ghost" className="h-11 w-11 !p-0 text-text-muted hover:text-success hover:bg-success/10 rounded-xl" onClick={() => handleAbrirQrModal(u)} title="Acesso por QR Code" aria-label={`QR Code de acesso de ${u.nome}`}>
                          <QrCode className="w-5 h-5" />
                        </Button>
                      ) : (
                        <div /> 
                      )}

                      {currentUser && ['ADMIN', 'RH'].includes(currentUser.role) && (
                        <Button
                          variant="ghost"
                          className="h-11 w-11 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-xl col-span-2 mt-1"
                          onClick={() => setUsuarioParaInativar(u)}
                          title="Desligar Integrante"
                        >
                          <UserX className="w-5 h-5 mx-auto" />
                        </Button>
                      )}
                    </div>
                  </td>
                </>
              )}

              // --- MOBILE (Cards) ---
              renderMobile={(u) => (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setUsuarioSelecionado(u);
                    }
                  }}
                  className="text-left w-full p-5 border-b border-border/50 hover:bg-surface-hover/30 transition-colors cursor-pointer hover-lift rounded-2xl m-2 glass block"
                  onClick={() => setUsuarioSelecionado(u)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-start gap-4">
                      <Avatar nome={u.nome} url={(u as any).fotoUrl || u.image} size="lg" />
                      <div className="flex flex-col gap-0.5 justify-center mt-1">
                        <h3 className="font-black text-text-main text-lg tracking-tight leading-none mb-1.5">{getFirstAndLastName(u.nome)}</h3>
                        {u.cargo?.nome ? (
                          <Badge variant="info" className="shadow-sm">{u.cargo.nome}</Badge>
                        ) : (
                          <BadgeRole role={u.role} />
                        )}
                        {u.cargo?.nome && u.cargo.nome.toUpperCase() !== u.role.replace('_', ' ') && (
                          <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider mt-1 block">
                            Permissão: {u.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-dashed border-border/60 pt-4" onClick={e => e.stopPropagation()}>
                      <Button variant="secondary" className="text-[11px] min-h-[44px] flex-1 bg-surface border-border/60 shadow-sm rounded-xl justify-center" onClick={() => setUsuarioSelecionado(u)}>
                        <Activity className="w-3.5 h-3.5 mr-1.5" /> Histórico
                      </Button>

                      {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO' || u.role === 'AUXILIAR_OPERACIONAL') && (
                        <Button variant="secondary" className="text-[11px] min-h-[44px] flex-1 bg-success/10 text-success border-success/20 hover:bg-success/20 rounded-xl justify-center" onClick={() => handleAbrirQrModal(u)}>
                          <QrCode className="w-3.5 h-3.5 mr-1.5" /> QR Code
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )}

        <ConfirmInativar
          isOpen={!!usuarioParaInativar}
          onClose={() => setUsuarioParaInativar(null)}
          onConfirm={async () => {
            if (!usuarioParaInativar) return;
            try {
              await api.delete(`/users/${usuarioParaInativar.id}`);
              toast.success('Integrante desligado com sucesso');
              refetch();
            } finally {
              setUsuarioParaInativar(null);
            }
          }}
          userName={usuarioParaInativar?.nome || ''}
          isLoading={false}
        />

        <ModalNovoIntegrante
          isOpen={novoIntegranteOpen}
          onClose={() => setNovoIntegranteOpen(false)}
          onSuccess={refetch}
          cargos={cargos}
        />

      </div>
    </PullToRefresh>
  );
}

// Wrapper para usar o Badge oficial com mapeamento de roles (incluindo o AUXILIAR)
function BadgeRole({ role }: { role: UserRole }) {
  const map: Record<string, "success" | "warning" | "neutral" | "danger" | "info"> = {
    'ADMIN': 'danger',
    'ENCARREGADO': 'info',
    'OPERADOR': 'success',
    'RH': 'warning',
    'COORDENADOR': 'warning',
    'AUXILIAR_OPERACIONAL': 'info'
  };

  const variant = map[role] || 'neutral';

  return (
    <Badge variant={variant} className="shadow-sm">
      {role.replace('_', ' ')}
    </Badge>
  );
}