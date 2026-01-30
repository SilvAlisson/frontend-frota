import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Badge } from './ui/Badge'; // Importando Badge oficial
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { ModalTreinamentosUsuario } from './ModalTreinamentosUsuario';
import { exportarParaExcel } from '../utils';
import { TableStyles } from '../styles/table';
import { toast } from 'sonner';
import { 
  Trash2, Edit2, QrCode, GraduationCap, 
  Search, Download, Plus,
} from 'lucide-react'; // Ícones Lucide

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
      toast.success('Usuário removido com sucesso.');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Erro ao remover usuário.');
    }
  });

  const handleDelete = async (id: string) => {
    if (id === adminUserId) {
      toast.error("Você não pode remover o seu próprio usuário.");
      return;
    }

    if (!window.confirm("ATENÇÃO: Deseja realmente remover este usuário do sistema?")) return;

    deleteMutation.mutate(id);
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
      exportarParaExcel(dados, "Lista_Usuarios.xlsx");
      resolve(true);
    });
    toast.promise(promessa, { loading: 'Gerando Excel...', success: 'Exportado!', error: 'Erro.' });
  };

  // --- RENDERIZAÇÃO DE FORMULÁRIOS ---
  if (isCadastroOpen) {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div
          className="mb-4 flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-primary transition-colors"
          onClick={() => setIsCadastroOpen(false)}
        >
          <span>← Voltar para a lista</span>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-card border border-border max-w-2xl mx-auto">
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
      <div className="animate-in slide-in-from-right duration-300">
        <div
          className="mb-4 flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-primary transition-colors"
          onClick={() => setUsuarioParaEditar(null)}
        >
          <span>← Voltar para a lista</span>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-card border border-border max-w-2xl mx-auto">
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
    <div className="space-y-6 animate-enter pb-10">

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Equipe</h1>
          <p className="text-text-secondary text-sm">Gerencie colaboradores, motoristas e acessos.</p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="flex-1 md:w-64">
            <Input
              placeholder="Buscar nome, email ou matrícula..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-surface"
              icon={<Search className="w-4 h-4 text-text-muted" />}
            />
          </div>

          <Button variant="secondary" onClick={handleExportar} className="whitespace-nowrap hidden sm:flex" icon={<Download className="w-4 h-4" />}>
            Excel
          </Button>

          <Button onClick={() => setIsCadastroOpen(true)} className="whitespace-nowrap" icon={<Plus className="w-4 h-4" />}>
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* LISTAGEM RESPONSIVA */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-surface-hover rounded-xl animate-pulse border border-border" />)}
        </div>
      ) : (
        <ListaResponsiva
          itens={usuariosFiltrados}
          emptyMessage="Nenhum colaborador encontrado."

          // --- DESKTOP ---
          desktopHeader={
            <>
              <th className={TableStyles.th}>Colaborador</th>
              <th className={TableStyles.th}>Função / Matrícula</th>
              <th className={TableStyles.th}>Contato</th>
              <th className={`${TableStyles.th} text-right`}>Ações</th>
            </>
          }
          renderDesktop={(u) => (
            <>
              <td className={TableStyles.td}>
                <div className="flex items-center gap-3">
                  <Avatar nome={u.nome} url={u.fotoUrl} />
                  <span className="font-bold text-text-main text-sm">{u.nome}</span>
                </div>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col items-start gap-1">
                  <BadgeRole role={u.role} />
                  {u.matricula && <span className="text-xs text-text-muted font-mono">MAT: {u.matricula}</span>}
                </div>
              </td>
              <td className={`${TableStyles.td} text-sm text-text-secondary`}>
                {u.email}
              </td>
              <td className={`${TableStyles.td} text-right`}>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-primary" onClick={() => setUsuarioParaTreinamento(u)} title="Treinamentos">
                    <GraduationCap className="w-4 h-4" />
                  </Button>

                  {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') && (
                    <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-success" onClick={() => handleAbrirQrModal(u)} title="QR Code">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  )}

                  <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-primary" onClick={() => setUsuarioParaEditar(u)} title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-error" onClick={() => handleDelete(u.id)} disabled={deleteMutation.isPending || u.id === adminUserId} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </>
          )}

          // --- MOBILE (Cards) ---
          renderMobile={(u) => (
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Avatar nome={u.nome} url={u.fotoUrl} size="lg" />
                  <div>
                    <h3 className="font-bold text-text-main">{u.nome}</h3>
                    <p className="text-xs text-text-secondary mb-1">{u.email}</p>
                    <BadgeRole role={u.role} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-dashed border-border pt-3">
                <Button variant="ghost" className="text-xs h-8 px-2.5 bg-surface border border-border" onClick={() => setUsuarioParaTreinamento(u)}>Treinos</Button>
                <Button variant="ghost" className="text-xs h-8 px-2.5 bg-surface border border-border" onClick={() => setUsuarioParaEditar(u)}>Editar</Button>

                {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') && (
                  <Button variant="ghost" className="text-xs h-8 px-2.5 bg-surface border border-border text-success hover:text-success" onClick={() => handleAbrirQrModal(u)}>QR</Button>
                )}

                <Button variant="ghost" className="text-xs h-8 px-2.5 bg-error/5 text-error hover:bg-error/10 border border-error/20" onClick={() => handleDelete(u.id)}>Excluir</Button>
              </div>
            </div>
          )}
        />
      )}

      {/* --- MODAIS DE APOIO --- */}
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
  const dims = size === 'md' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm';

  if (url) return <img src={url} alt={nome} className={`${dims} rounded-full object-cover border border-border shadow-sm`} />;

  return (
    <div className={`${dims} rounded-full bg-surface-hover text-text-secondary flex items-center justify-center font-bold border border-border`}>
      {initials}
    </div>
  );
}

// Wrapper para usar o Badge oficial com mapeamento de roles
function BadgeRole({ role }: { role: UserRole }) {
  const map: Record<string, "success" | "warning" | "neutral" | "danger" | "info"> = {
    'ADMIN': 'danger', // Roxo não tem badge nativa, usando Danger ou Info
    'ENCARREGADO': 'info',
    'OPERADOR': 'success',
    'RH': 'warning',
    'COORDENADOR': 'warning'
  };

  const variant = map[role] || 'neutral';
  
  return (
    <Badge variant={variant}>
      {role}
    </Badge>
  );
}