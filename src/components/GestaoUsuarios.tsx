import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { ModalTreinamentosUsuario } from './ModalTreinamentosUsuario';
import { toast } from 'sonner';
import type { User } from '../types';

// Ícones Minimalistas
function IconeTreinamento() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.216 50.59 50.59 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>; }
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function IconeQrCode() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" /></svg>; }

interface GestaoUsuariosProps {
  adminUserId: string;
}

export function GestaoUsuarios({ adminUserId }: GestaoUsuariosProps) {
  const queryClient = useQueryClient();

  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [usuarioIdSelecionado, setUsuarioIdSelecionado] = useState<string | null>(null);
  const [usuarioParaTreinamento, setUsuarioParaTreinamento] = useState<User | null>(null);

  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [tokenQr, setTokenQr] = useState<string | null>(null);
  const [nomeQr, setNomeQr] = useState('');
  const [fotoQr, setFotoQr] = useState<string | null | undefined>(null);
  const [roleQr, setRoleQr] = useState<string>('');

  // QUERY: Listar Usuários
  const { data: usuarios = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/user');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // MUTATION: Deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/user/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      throw err;
    }
  });

  const handleDelete = async (id: string) => {
    if (id === adminUserId) {
      toast.error("Você não pode remover o seu próprio usuário.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja REMOVER este usuário?")) return;

    const promise = deleteMutation.mutateAsync(id);

    toast.promise(promise, {
      loading: 'Removendo usuário...',
      success: 'Usuário removido com sucesso.',
      error: 'Erro ao remover usuário. Tente novamente.'
    });
  };

  const handleGerarQrCode = async (user: User) => {
    const promise = api.post(`/auth/user/${user.id}/generate-token`);

    toast.promise(promise, {
      loading: 'Gerando QR Code...',
      success: (response) => {
        setTokenQr(response.data.loginToken);
        setNomeQr(user.nome);
        setFotoQr(user.fotoUrl);
        setRoleQr(user.role);
        setModalQrOpen(true);
        return `QR Code gerado para ${user.nome}`;
      },
      error: 'Erro ao gerar token de acesso.'
    });
  };

  const handleExportar = () => {
    if (usuarios.length === 0) return;

    const promessa = new Promise((resolve) => {
      const dados = usuarios.map(u => ({
        'Nome': u.nome,
        'Email': u.email,
        'Matrícula': u.matricula || '-',
        'Função': u.role
      }));
      exportarParaExcel(dados, "Lista_Usuarios.xlsx");
      resolve(true);
    });

    toast.promise(promessa, {
      loading: 'Gerando Excel...',
      success: 'Planilha exportada!',
      error: 'Erro na exportação.'
    });
  };

  const handleVoltar = () => {
    setModo('listando');
    setUsuarioIdSelecionado(null);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ENCARREGADO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RH': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'OPERADOR': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COORDENADOR': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER DE COMANDO (Glass Panel) */}
      <div className="glass-panel p-1 rounded-xl sticky top-0 z-10 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-white/50 rounded-lg">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-2">
              Equipe & Acessos
            </h3>
            <p className="text-[10px] text-gray-400 pl-2 font-mono">
              {usuarios.length} Colaboradores Ativos
            </p>
          </div>

          {modo === 'listando' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={handleExportar}
                disabled={usuarios.length === 0}
                className="shadow-sm bg-white border border-gray-200 h-9 text-xs"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                }
              >
                Excel
              </Button>
              <Button
                variant="primary"
                onClick={() => setModo('adicionando')}
                className="shadow-md shadow-primary/20 h-9 text-xs"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
              >
                Novo Usuário
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* FORMULÁRIOS */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-float border border-gray-100 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
          <FormCadastrarUsuario onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {modo === 'editando' && usuarioIdSelecionado && (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-float border border-gray-100 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
          <FormEditarUsuario
            userId={usuarioIdSelecionado}
            onSuccess={handleVoltar}
            onCancelar={handleVoltar}
          />
        </div>
      )}

      {/* LISTAGEM (GRID INDUSTRIAL) */}
      {modo === 'listando' && (
        <>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {usuarios.map((user) => (
                <div key={user.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-float hover:border-primary/30 transition-all duration-300 flex flex-col relative overflow-hidden">

                  {/* Topo: Avatar e Dados Principais */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-400 border-2 border-white shadow-sm overflow-hidden ring-1 ring-gray-100">
                        {user.fotoUrl ? (
                          <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
                        ) : (
                          user.nome.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="font-bold text-gray-900 truncate text-base leading-tight" title={user.nome}>
                        {user.nome}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mb-1" title={user.email}>
                        {user.email}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getRoleBadgeStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Informações Secundárias */}
                  <div className="mb-4 pt-3 border-t border-dashed border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-medium">Matrícula</span>
                      <span className="font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                        {user.matricula || '---'}
                      </span>
                    </div>
                  </div>

                  {/* Ações (Grid de Botões) */}
                  <div className="mt-auto grid grid-cols-4 gap-1">
                    
                    <Button
                      variant="ghost"
                      className="h-9 w-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      onClick={() => setUsuarioParaTreinamento(user)}
                      title="Treinamentos"
                    >
                      <IconeTreinamento />
                    </Button>

                    <Button
                      variant="ghost"
                      className={`h-9 w-full flex items-center justify-center rounded-lg transition-colors border border-transparent 
                        ${(user.role === 'OPERADOR' || user.role === 'ENCARREGADO') 
                          ? 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100' 
                          : 'text-gray-200 cursor-not-allowed'}`}
                      onClick={() => (user.role === 'OPERADOR' || user.role === 'ENCARREGADO') && handleGerarQrCode(user)}
                      title="Gerar QR Code"
                      disabled={!(user.role === 'OPERADOR' || user.role === 'ENCARREGADO')}
                    >
                      <IconeQrCode />
                    </Button>

                    <Button
                      variant="ghost"
                      className="h-9 w-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      onClick={() => { setUsuarioIdSelecionado(user.id); setModo('editando'); }}
                      title="Editar"
                    >
                      <IconeEditar />
                    </Button>

                    <Button
                      variant="ghost"
                      className="h-9 w-full flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isPending || user.id === adminUserId}
                      title="Remover"
                    >
                      <IconeLixo />
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}

          {!isLoading && usuarios.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">Nenhum colaborador encontrado</h4>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Adicione membros à equipe para gerenciar acessos e funções.
              </p>
              <Button
                variant="ghost"
                onClick={() => setModo('adicionando')}
                className="mt-4 text-primary bg-primary/5 hover:bg-primary/10"
              >
                Cadastrar Primeiro Usuário
              </Button>
            </div>
          )}
        </>
      )}

      {/* --- MODAIS --- */}
      {modalQrOpen && tokenQr && (
        <ModalQrCode
          token={tokenQr}
          nomeUsuario={nomeQr}
          fotoUrl={fotoQr}
          role={roleQr}
          onClose={() => { setModalQrOpen(false); setTokenQr(null); setFotoQr(null); setRoleQr(''); }}
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