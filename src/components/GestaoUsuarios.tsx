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

// Ícones
function IconeTreinamento() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.216 50.59 50.59 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>; }
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function IconeQrCode() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5ZM14.25 15a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" /></svg>; }

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
      throw err; // Propaga para o toast
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ENCARREGADO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RH': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'OPERADOR': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Equipe & Colaboradores
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie acessos, funções e documentação do time.
          </p>
        </div>

        {modo === 'listando' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="success"
              className="flex-1 sm:flex-none bg-green-600 text-white border-transparent shadow-sm"
              onClick={handleExportar}
              disabled={usuarios.length === 0}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Excel
            </Button>
            <Button
              variant="primary"
              onClick={() => setModo('adicionando')}
              className="flex-1 sm:flex-none shadow-lg shadow-primary/20"
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

      {/* FORMULÁRIOS */}
      {modo === 'adicionando' && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-2xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormCadastrarUsuario onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {modo === 'editando' && usuarioIdSelecionado && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-2xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormEditarUsuario
            userId={usuarioIdSelecionado}
            onSuccess={handleVoltar}
            onCancelar={handleVoltar}
          />
        </div>
      )}

      {/* LISTAGEM (GRID DE CARDS) */}
      {modo === 'listando' && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4"></div>
              <p className="text-primary font-medium animate-pulse">Carregando equipe...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {usuarios.map((user) => (
                <div key={user.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col relative overflow-hidden">

                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 border-2 border-white shadow-sm">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate" title={user.nome}>
                        {user.nome}
                      </h4>
                      <p className="text-xs text-gray-500 truncate" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Badge de Função */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.matricula && (
                      <span className="ml-2 text-xs text-gray-400 font-mono">
                        #{user.matricula}
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex justify-end gap-1">

                    <Button
                      variant="ghost"
                      className="!p-2 h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      onClick={() => setUsuarioParaTreinamento(user)}
                      title="Treinamentos"
                      icon={<IconeTreinamento />}
                    />

                    {user.role === 'OPERADOR' && (
                      <Button
                        variant="ghost"
                        className="!p-2 h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        onClick={() => handleGerarQrCode(user)}
                        title="Gerar QR Code"
                        icon={<IconeQrCode />}
                      />
                    )}

                    <Button
                      variant="ghost"
                      className="!p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      onClick={() => { setUsuarioIdSelecionado(user.id); setModo('editando'); }}
                      title="Editar"
                      icon={<IconeEditar />}
                    />

                    <Button
                      variant="ghost"
                      className="!p-2 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isPending || user.id === adminUserId}
                      title="Remover"
                      icon={<IconeLixo />}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && usuarios.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
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
                className="mt-4 text-primary hover:bg-primary/5"
              >
                Cadastrar Primeiro Usuário
              </Button>
            </div>
          )}
        </>
      )}

      {/* --- MODAIS --- */}
      {modalQrOpen && tokenQr && (
        <ModalQrCode token={tokenQr} nomeUsuario={nomeQr} onClose={() => { setModalQrOpen(false); setTokenQr(null); }} />
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