import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Badge } from './ui/Badge'; 
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { ModalTreinamentosUsuario } from './ModalTreinamentosUsuario';
import { exportarParaExcel } from '../utils';
import { TableStyles } from '../styles/table';
import { toast } from 'sonner';
import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';

import { 
  Trash2, Edit2, QrCode, GraduationCap, 
  Search, Download, Plus, Users
} from 'lucide-react'; 

interface GestaoUsuariosProps {
  adminUserId: string;
}

export function GestaoUsuarios({ adminUserId }: GestaoUsuariosProps) {
  const queryClient = useQueryClient();

  // Estados de Fluxo
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<User | null>(null);
  const [busca, setBusca] = useState('');

  // Estados dos Modais Específicos
  const [usuarioParaTreinamento, setUsuarioParaTreinamento] = useState<User | null>(null);
  const [usuarioParaQr, setUsuarioParaQr] = useState<User | null>(null);
  
  // ✨ Estados para o Modal de Exclusão Segura
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // 1. Data Fetching
  const { data: usuarios = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Filtragem Local
  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    (u.matricula && u.matricula.includes(busca))
  );

  // 3. Ações
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Colaborador removido com sucesso.');
      setUserToDelete(null); // Fecha o modal após o sucesso
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Erro ao remover colaborador.');
      setUserToDelete(null);
    }
  });

  // ✨ Lógica atualizada para usar o ConfirmModal em vez do window.confirm
  const handleDeleteRequest = (user: User) => {
    if (user.id === adminUserId) {
      toast.error("Ação bloqueada: Não pode remover o seu próprio utilizador.");
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const handleAbrirQrModal = (user: User) => {
    setUsuarioParaQr(user);
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
      exportarParaExcel(dados, "Lista_Colaboradores.xlsx");
      resolve(true);
    });
    toast.promise(promessa, { loading: 'A gerar ficheiro Excel...', success: 'Transferência concluída!', error: 'Erro na exportação.' });
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

  // --- RENDERIZAÇÃO DA LISTA ---
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

      {/* HEADER DA PÁGINA (Com layout Apple-like) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Diretório de Equipa</h1>
          <p className="text-text-secondary font-medium mt-1.5 opacity-90">Gestão central de acessos, motoristas e equipa técnica.</p>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 items-end">
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

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={handleExportar} className="whitespace-nowrap flex-1 sm:flex-none h-11" icon={<Download className="w-4 h-4" />}>
              Excel
            </Button>
            <Button onClick={() => setIsCadastroOpen(true)} className="whitespace-nowrap flex-1 sm:flex-none h-11 shadow-button hover:shadow-float-primary" icon={<Plus className="w-4 h-4" />}>
              Novo Membro
            </Button>
          </div>
        </div>
      </div>

      {/* LISTAGEM RESPONSIVA */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-surface-hover/50 rounded-2xl animate-pulse border border-border/40" />)}
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <EmptyState 
            icon={Users}
            title={busca ? "Nenhum colaborador encontrado" : "Diretório Vazio"}
            description={busca ? "Tente usar outros termos de pesquisa." : "Adicione o primeiro membro da equipa para começar."}
        />
      ) : (
        <div className="bg-surface rounded-3xl shadow-sm border border-border/60 overflow-hidden">
          <ListaResponsiva
            itens={usuariosFiltrados}
            emptyMessage="" // Já tratado pelo EmptyState acima

            // --- DESKTOP ---
            desktopHeader={
              <>
                <th className={`${TableStyles.th} pl-8`}>Colaborador</th>
                <th className={TableStyles.th}>Estatuto Operacional</th>
                <th className={TableStyles.th}>Contacto</th>
                <th className={`${TableStyles.th} text-right pr-8`}>Ações de Gestão</th>
              </>
            }
            renderDesktop={(u) => (
              <>
                <td className={`${TableStyles.td} pl-8`}>
                  <div className="flex items-center gap-4">
                    <Avatar nome={u.nome} url={u.fotoUrl} />
                    <span className="font-bold text-text-main text-base tracking-tight">{u.nome}</span>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col items-start gap-1.5">
                    <BadgeRole role={u.role} />
                    {u.matricula && <span className="text-[10px] text-text-muted font-mono font-bold uppercase tracking-widest bg-surface-hover px-1.5 py-0.5 rounded">ID: {u.matricula}</span>}
                  </div>
                </td>
                <td className={`${TableStyles.td} text-sm font-medium text-text-secondary`}>
                  {u.email}
                </td>
                <td className={`${TableStyles.td} text-right pr-8`}>
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => setUsuarioParaTreinamento(u)} title="Registo de Treinamentos">
                      <GraduationCap className="w-4 h-4" />
                    </Button>

                    {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') && (
                      <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-success hover:bg-success/10 rounded-xl" onClick={() => handleAbrirQrModal(u)} title="Acesso por QR Code">
                        <QrCode className="w-4 h-4" />
                      </Button>
                    )}

                    <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => setUsuarioParaEditar(u)} title="Editar Ficha">
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="h-9 w-9 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-xl" 
                      onClick={() => handleDeleteRequest(u)} 
                      disabled={deleteMutation.isPending || u.id === adminUserId} 
                      title="Remover Colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </>
            )}

            // --- MOBILE (Cards) ---
            renderMobile={(u) => (
              <div className="p-5 border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <Avatar nome={u.nome} url={u.fotoUrl} size="lg" />
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-black text-text-main text-lg tracking-tight leading-none">{u.nome}</h3>
                      <p className="text-xs text-text-secondary font-medium mb-1.5">{u.email}</p>
                      <BadgeRole role={u.role} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-dashed border-border/60 pt-4">
                  <Button variant="secondary" className="text-xs h-9 px-3 bg-surface border-border/60 shadow-sm" onClick={() => setUsuarioParaTreinamento(u)}>Treinos</Button>
                  <Button variant="secondary" className="text-xs h-9 px-3 bg-surface border-border/60 shadow-sm" onClick={() => setUsuarioParaEditar(u)}>Editar</Button>

                  {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') && (
                    <Button variant="secondary" className="text-xs h-9 px-3 bg-success/10 text-success border-success/20 hover:bg-success/20" onClick={() => handleAbrirQrModal(u)}>QR</Button>
                  )}

                  <Button variant="secondary" className="text-xs h-9 px-3 bg-error/10 text-error border-error/20 hover:bg-error/20" onClick={() => handleDeleteRequest(u)}>Excluir</Button>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* --- MODAIS DE APOIO --- */}

      {/* ✨ O NOSSO NOVO CONFIRM MODAL EM AÇÃO */}
      <ConfirmModal 
        isOpen={!!userToDelete}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Colaborador"
        description={`Tem a certeza que deseja remover as credenciais de acesso de ${userToDelete?.nome}? Esta ação é irreversível.`}
        variant="danger"
        confirmLabel={deleteMutation.isPending ? "A remover..." : "Sim, Remover Acesso"}
      />

      {usuarioParaQr && (
        <ModalQrCode
          user={usuarioParaQr}
          onClose={() => setUsuarioParaQr(null)}
          onUpdate={() => refetch()}
        />
      )}

      {usuarioParaTreinamento && (
        <ModalTreinamentosUsuario
          usuario={usuarioParaTreinamento}
          onClose={() => setUsuarioParaTreinamento(null)}
        />
      )}
    </div>
  );
}

// --- Componentes Auxiliares (Design System Local) ---

function Avatar({ nome, url, size = 'md' }: { nome: string, url?: string | null, size?: 'md' | 'lg' }) {
  const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const dims = size === 'md' ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm';

  if (url) return <img src={url} alt={nome} className={`${dims} rounded-2xl object-cover border border-border/60 shadow-sm`} />;

  return (
    <div className={`${dims} rounded-2xl bg-surface-hover text-text-secondary flex items-center justify-center font-black border border-border/60 shadow-inner`}>
      {initials}
    </div>
  );
}

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