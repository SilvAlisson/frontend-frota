import { useState } from 'react';
import type { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Badge } from './ui/Badge'; 
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { ModalTreinamentosUsuario } from './ModalTreinamentosUsuario';
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
  Trash2, Edit2, QrCode, GraduationCap, 
  Search, Download, Plus, Users, Printer
} from 'lucide-react'; 

import { PageHeader } from './ui/PageHeader';
import { SmartFAB } from './ui/SmartFAB';
import { PullToRefresh } from './ui/PullToRefresh';

// DOMÍNIO E MODAL GLOBAL
import { useUsuarios } from '../hooks/useUsuarios';
import { useModalStore } from '../hooks/useModalStore';
import { useDebounce } from '../hooks/useDebounce';

interface GestaoUsuariosProps {
  adminUserId: string;
}

export function GestaoUsuarios({ adminUserId }: GestaoUsuariosProps) {
  // Estados de Fluxo
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<User | null>(null);
  const [busca, setBusca] = useState('');

  const { usuarios, isLoading, refetch, excluirUsuario, isExcluindo } = useUsuarios();
  const { openModal, closeModal } = useModalStore();

  const buscaDebounced = useDebounce(busca, 300);

  // Filtragem Local
  const usuariosFiltrados = usuarios.filter(u => {
    if (!buscaDebounced) return true;
    const termo = buscaDebounced.toLowerCase();
    return u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      (u.matricula && u.matricula.includes(buscaDebounced));
  });

  // --- AÇÕES COM MODAL GLOBAL ---
  const handleDeleteRequest = (user: User) => {
    if (user.id === adminUserId) {
      toast.error("Ação bloqueada: Não pode remover o seu próprio Usuário.");
      return;
    }
    
    openModal('CONFIRM', {
      title: "Inativar ou Remover Integrante",
      description: `Tem certeza que deseja inativar ou remover as credenciais de acesso de ${user.nome}? Se o usuário possuir histórico, ele será apenas inativado para manter o histórico da frota.`,
      variant: "danger",
      confirmLabel: "Sim, Confirmar Ação",
      onConfirm: async () => {
        await excluirUsuario(user.id);
      }
    });
  };

  const handleAbrirQrModal = (user: User) => {
    const modalId = openModal('CUSTOM', {
      content: (
        <ModalQrCode
          user={{ ...user, loginToken: user.loginToken ?? undefined }}
          onClose={() => closeModal(modalId)}
          onUpdate={() => {
             refetch();
          }}
        />
      )
    });
  };

  const handleAbrirTreinamentosModal = (user: User) => {
    const modalId = openModal('CUSTOM', {
      content: (
        <ModalTreinamentosUsuario
          usuario={user}
          onClose={() => {
              closeModal(modalId);
              refetch(); // Atualiza a lista caso os treinos alterem o status do operador
          }}
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
        'RH': 'RH', 'COORDENADOR': 'Coordenador'
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
      exportarParaExcel(dados, "Lista_Integrantes.xlsx");
      resolve(true);
    });
    toast.promise(promessa, { loading: 'Gerando Arquivo Excel...', success: 'Transferência concluída!', error: 'Erro na exportação.' });
  };

  // --- RENDERIZAÇÃO DE FORMULÁRIOS ---
  if (isCadastroOpen) {
    return (
      <div className="animate-in slide-in-from-right duration-500">
        <div
          className="mb-4 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit"
          onClick={() => setIsCadastroOpen(false)}
        >
          <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar para o diretório
        </div>
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-2xl mx-auto">
          <FormCadastrarUsuario
            onSuccess={() => { setIsCadastroOpen(false); refetch(); }}
            onCancelar={() => setIsCadastroOpen(false)}
          />
        </div>
      </div>
    );
  }

  if (usuarioParaEditar) {
    return (
      <div className="animate-in slide-in-from-right duration-500">
        <div
          className="mb-4 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit"
          onClick={() => setUsuarioParaEditar(null)}
        >
          <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar para o diretório
        </div>
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-2xl mx-auto">
          <FormEditarUsuario
            userId={usuarioParaEditar.id}
            onSuccess={() => { setUsuarioParaEditar(null); refetch(); }}
            onCancelar={() => setUsuarioParaEditar(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

        {/* HEADER DA PÁGINA (Padrão KLIN Elite) */}
        <PageHeader
          title="Hub de Integrantes"
          subtitle="Controle de acessos, treinamentos, certificados em nuvem e conformidade da equipe."
          extraAction={
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 items-end mt-4 sm:mt-0">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Buscar por nome, email ou matrícula..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="bg-surface-hover/50 border-none font-medium"
                  icon={<Search className="w-4 h-4 text-text-muted" />}
                  containerClassName="!mb-0"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <Button variant="secondary" onClick={handleExportar} className="whitespace-nowrap flex-1 sm:flex-none h-11" icon={<Download className="w-4 h-4" />}>
                  Excel
                </Button>
                <Button variant="secondary" onClick={handleAbrirEtiquetasModal} className="whitespace-nowrap flex-1 sm:flex-none h-11 shadow-sm border-border" icon={<Printer className="w-4 h-4 text-primary" />}>
                  Imprimir QRs
                </Button>
                <Button onClick={() => setIsCadastroOpen(true)} className="whitespace-nowrap flex-1 sm:flex-none h-11 shadow-button hover:shadow-float-primary" icon={<Plus className="w-4 h-4" />}>
                  Novo Integrante
                </Button>
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
            title={busca ? "Nenhum integrante encontrado" : "Diretório Vazio"}
            description={busca ? "Tente usar outros termos de pesquisa." : "Adicione o primeiro integrante para começar."}
        />
      ) : (
        <div className="bg-surface rounded-3xl shadow-sm border border-border/60 overflow-hidden">
          <ListaResponsiva
            itens={usuariosFiltrados}
            emptyMessage="" // Já tratado pelo EmptyState acima

            // --- DESKTOP ---
            desktopHeader={
              <>
                <th className={`${TableStyles.th} pl-8 text-left w-2/5`}>Integrante</th>
                <th className={`${TableStyles.th} text-center w-1/4`}>Estatuto Operacional</th>
                <th className={`${TableStyles.th} text-right pr-8 w-1/4`}>Gestão</th>
              </>
            }
            renderDesktop={(u) => (
              <>
                <td className={`${TableStyles.td} pl-8`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar nome={u.nome} url={u.fotoUrl || u.image} />
                    <span className="font-bold text-text-main text-base tracking-tight truncate" title={u.nome}>{getFirstAndLastName(u.nome)}</span>
                  </div>
                </td>
                <td className={`${TableStyles.td} text-center`}>
                  <div className="w-full flex flex-col items-center justify-center gap-1.5 text-center">
                    <BadgeRole role={u.role} />
                    {u.matricula && <span className="text-[10px] text-text-muted font-mono font-bold uppercase tracking-widest bg-surface-hover px-1.5 py-0.5 rounded border border-border/50 block w-fit truncate">ID: {u.matricula}</span>}
                  </div>
                </td>
                <td className={`${TableStyles.td} text-right pr-8`}>
                  <div className="grid grid-cols-2 gap-1.5 w-fit ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => handleAbrirTreinamentosModal(u)} title="Registro de Treinamentos">
                      <GraduationCap className="w-4 h-4" />
                    </Button>

                    {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') ? (
                      <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-success hover:bg-success/10 rounded-xl" onClick={() => handleAbrirQrModal(u)} title="Acesso por QR Code">
                        <QrCode className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div /> /* Empty div to keep the grid layout aligned */
                    )}

                    <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => setUsuarioParaEditar(u)} title="Editar Ficha">
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="h-9 w-9 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-xl" 
                      onClick={() => handleDeleteRequest(u)} 
                      disabled={isExcluindo || u.id === adminUserId} 
                      title="Inativar Integrante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </>
            )}

            // --- MOBILE (Cards) ---
            renderMobile={(u) => (
              <div className="p-5 border-b border-border/50 hover:bg-surface-hover/30 transition-colors cursor-pointer hover-lift rounded-2xl m-2 glass" onClick={() => setUsuarioParaEditar(u)}>
                <div className="flex flex-col">
                  <div className="flex items-start gap-4">
                    <Avatar nome={u.nome} url={u.fotoUrl || u.image} size="lg" />
                    <div className="flex flex-col gap-0.5 justify-center mt-1">
                      <h3 className="font-black text-text-main text-lg tracking-tight leading-none mb-1.5">{getFirstAndLastName(u.nome)}</h3>
                      <BadgeRole role={u.role} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-dashed border-border/60 pt-4" onClick={e => e.stopPropagation()}>
                    <Button variant="secondary" className="text-[11px] h-10 w-full bg-surface border-border/60 shadow-sm rounded-xl justify-center" onClick={() => handleAbrirTreinamentosModal(u)}>Treinos</Button>
                    <Button variant="secondary" className="text-[11px] h-10 w-full bg-surface border-border/60 shadow-sm rounded-xl justify-center" onClick={() => setUsuarioParaEditar(u)}>Editar</Button>

                    {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') ? (
                      <>
                        <Button variant="secondary" className="text-[11px] h-10 w-full bg-success/10 text-success border-success/20 hover:bg-success/20 rounded-xl justify-center" onClick={() => handleAbrirQrModal(u)}>Acesso QR</Button>
                        <Button variant="secondary" className="text-[11px] h-10 w-full bg-error/10 text-error border-error/20 hover:bg-error/20 rounded-xl justify-center" onClick={() => handleDeleteRequest(u)}>Inativar</Button>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <Button variant="secondary" className="text-[11px] h-10 w-full bg-error/10 text-error border-error/20 hover:bg-error/20 rounded-xl justify-center" onClick={() => handleDeleteRequest(u)}>Inativar</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <SmartFAB 
        onClick={() => setIsCadastroOpen(true)} 
        label="Novo Integrante" 
      />

    </div>
    </PullToRefresh>
  );
}

// --- Componentes Auxiliares (Design System Local) ---

// Wrapper para usar o Badge oficial com mapeamento de roles
function BadgeRole({ role }: { role: UserRole }) {
  const map: Record<string, "success" | "warning" | "neutral" | "danger" | "info"> = {
    'ADMIN': 'danger', 
    'ENCARREGADO': 'info',
    'OPERADOR': 'success',
    'RH': 'warning',
    'COORDENADOR': 'warning'
  };

  const variant = map[role] || 'neutral';
  
  return (
    <Badge variant={variant} className="shadow-sm">
      {role}
    </Badge>
  );
}