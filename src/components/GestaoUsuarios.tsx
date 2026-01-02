import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { ModalTreinamentosUsuario } from './ModalTreinamentosUsuario';
import { exportarParaExcel } from '../utils';
import { TableStyles } from '../styles/table';
import { toast } from 'sonner';

// --- Ícones ---
function IconeTreinamento() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.216 50.59 50.59 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>; }
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function IconeQrCode() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" /></svg>; }

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

  // [CORREÇÃO] Estado para armazenar o objeto usuário completo para o ModalQrCode
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

  // [CORREÇÃO] Apenas abre o modal, sem gerar token nem pedir confirmação ainda
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
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary transition-colors"
          onClick={() => setIsCadastroOpen(false)}
        >
          <span>← Voltar para a lista</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border max-w-2xl mx-auto">
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
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary transition-colors"
          onClick={() => setUsuarioParaEditar(null)}
        >
          <span>← Voltar para a lista</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border max-w-2xl mx-auto">
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Equipe</h1>
          <p className="text-gray-500 text-sm">Gerencie colaboradores, motoristas e acessos.</p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="flex-1 md:w-64">
            <Input
              placeholder="Buscar nome, email ou matrícula..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-white"
            />
          </div>

          <Button variant="secondary" onClick={handleExportar} className="whitespace-nowrap hidden sm:flex">
            Excel
          </Button>

          <Button onClick={() => setIsCadastroOpen(true)} className="whitespace-nowrap">
            + Novo Colaborador
          </Button>
        </div>
      </div>

      {/* LISTAGEM RESPONSIVA */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-background rounded-xl animate-pulse border border-border" />)}
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
                  <span className="font-bold text-gray-900 text-sm">{u.nome}</span>
                </div>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col items-start gap-1">
                  <BadgeRole role={u.role} />
                  {u.matricula && <span className="text-xs text-gray-400 font-mono">MAT: {u.matricula}</span>}
                </div>
              </td>
              <td className={`${TableStyles.td} text-sm text-gray-600`}>
                {u.email}
              </td>
              <td className={`${TableStyles.td} text-right`}>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-indigo-600" onClick={() => setUsuarioParaTreinamento(u)} title="Treinamentos">
                    <IconeTreinamento />
                  </Button>

                  {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') && (
                    <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-green-600" onClick={() => handleAbrirQrModal(u)} title="QR Code">
                      <IconeQrCode />
                    </Button>
                  )}

                  <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-blue-600" onClick={() => setUsuarioParaEditar(u)} title="Editar">
                    <IconeEditar />
                  </Button>

                  <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600" onClick={() => handleDelete(u.id)} disabled={deleteMutation.isPending || u.id === adminUserId} title="Excluir">
                    <IconeLixo />
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
                    <h3 className="font-bold text-gray-900">{u.nome}</h3>
                    <p className="text-xs text-gray-500 mb-1">{u.email}</p>
                    <BadgeRole role={u.role} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-dashed border-border pt-3">
                <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => setUsuarioParaTreinamento(u)}>Treinos</Button>
                <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => setUsuarioParaEditar(u)}>Editar</Button>

                {(u.role === 'OPERADOR' || u.role === 'ENCARREGADO') && (
                  <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => handleAbrirQrModal(u)}>QR</Button>
                )}

                <Button variant="ghost" className="text-xs h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => handleDelete(u.id)}>Excluir</Button>
              </div>
            </div>
          )}
        />
      )}

      {/* --- MODAIS DE APOIO --- */}
      {/* [CORREÇÃO] Passamos o objeto usuario completo para o modal */}
      {usuarioParaQr && (
        <ModalQrCode
          user={usuarioParaQr}
          onClose={() => setUsuarioParaQr(null)}
          onUpdate={() => refetch()} // Recarrega a lista para obter o token se ele foi gerado
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
    <div className={`${dims} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20`}>
      {initials}
    </div>
  );
}

function BadgeRole({ role }: { role: UserRole }) {
  const styles = {
    'ADMIN': 'bg-purple-50 text-purple-700 border-purple-100',
    'ENCARREGADO': 'bg-blue-50 text-blue-700 border-blue-100',
    'OPERADOR': 'bg-green-50 text-green-700 border-green-100',
    'RH': 'bg-pink-50 text-pink-700 border-pink-100',
    'COORDENADOR': 'bg-orange-50 text-orange-700 border-orange-100'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[role] || 'bg-background text-gray-600 border-border'}`}>
      {role}
    </span>
  );
}