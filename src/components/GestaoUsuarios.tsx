import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { TableStyles } from '../styles/table';
import type { User } from '../types';
import { ModalTreinamentosUsuario } from './ModalTreinamentosUsuario';

// Estilos
const thStyle = TableStyles.th;
const tdStyle = TableStyles.td;

// --- Ícones ---

function IconeTreinamento() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.216 50.59 50.59 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  );
}

function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

function IconeEditar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function IconeQrCode() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5ZM14.25 15a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" />
    </svg>
  );
}

// --- Componente Principal ---

interface GestaoUsuariosProps {
  adminUserId: string;
}

export function GestaoUsuarios({ adminUserId }: GestaoUsuariosProps) {
  const queryClient = useQueryClient();

  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [usuarioIdSelecionado, setUsuarioIdSelecionado] = useState<string | null>(null);

  // Estado para controlar o modal de treinamentos
  const [usuarioParaTreinamento, setUsuarioParaTreinamento] = useState<User | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  // Estados para QR Code
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [tokenQr, setTokenQr] = useState<string | null>(null);
  const [nomeQr, setNomeQr] = useState('');

  // 1. QUERY: Listar Usuários
  const { data: usuarios = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/user');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });

  // 2. MUTATION: Deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/user/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Erro ao remover usuário.');
    }
  });

  // 3. MUTATION: Gerar QR Code
  const qrMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/auth/user/${userId}/generate-token`);
      return response.data.loginToken;
    },
    onError: () => alert("Erro ao gerar QR Code.")
  });

  const handleDelete = async (id: string) => {
    if (id === adminUserId) {
      alert("Você não pode remover o seu próprio usuário.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja REMOVER este usuário?")) return;
    deleteMutation.mutate(id);
  };

  const handleGerarQrCode = async (user: User) => {
    const token = await qrMutation.mutateAsync(user.id);
    if (token) {
      setTokenQr(token);
      setNomeQr(user.nome);
      setModalQrOpen(true);
    }
  };

  const handleExportar = () => {
    if (usuarios.length === 0) return;
    const dados = usuarios.map(u => ({
      'Nome': u.nome,
      'Email': u.email,
      'Matrícula': u.matricula || '-',
      'Função': u.role
    }));
    exportarParaExcel(dados, "Lista_Usuarios.xlsx");
  };

  const handleVoltar = () => {
    setModo('listando');
    setUsuarioIdSelecionado(null);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">Gestão de Integrantes</h3>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-error border border-red-200 rounded text-center text-sm">
          {errorMsg}
        </div>
      )}

      {/* --- MODO ADICIONAR --- */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">
          <FormCadastrarUsuario onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {/* --- MODO EDITAR --- */}
      {modo === 'editando' && usuarioIdSelecionado && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarUsuario
            userId={usuarioIdSelecionado}
            onSuccess={handleVoltar}
            onCancelar={handleVoltar}
          />
        </div>
      )}

      {/* --- MODO LISTAGEM --- */}
      {modo === 'listando' && (
        <div>
          <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
            <Button variant="primary" onClick={() => setModo('adicionando')}>+ Novo Usuário</Button>
            <Button variant="success" onClick={handleExportar} disabled={usuarios.length === 0}>Exportar Excel</Button>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-card rounded-card border border-gray-100 bg-white">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={thStyle}>Nome</th>
                    <th className={thStyle}>Email</th>
                    <th className={thStyle}>Matrícula</th>
                    <th className={thStyle}>Função</th>
                    <th className={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className={tdStyle + " font-medium"}>{user.nome}</td>
                      <td className={tdStyle}>{user.email}</td>
                      <td className={tdStyle}>{user.matricula || '-'}</td>
                      <td className={tdStyle}>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center
                          ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            user.role === 'ENCARREGADO' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'}
                        `}>
                          {user.role}
                        </span>
                      </td>
                      <td className={tdStyle}>
                        <div className="flex items-center gap-2">

                          {/* Botão de Treinamentos (RH) */}
                          <Button
                            variant="secondary"
                            className="!p-2 h-8 w-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => setUsuarioParaTreinamento(user)}
                            title="Gerenciar Treinamentos e Certificados"
                            icon={<IconeTreinamento />}
                          />

                          {user.role === 'OPERADOR' && (
                            <Button
                              variant="secondary"
                              className="!p-2 h-8 w-8"
                              onClick={() => handleGerarQrCode(user)}
                              disabled={qrMutation.isPending}
                              title="Gerar QR Code"
                              icon={<IconeQrCode />}
                            />
                          )}

                          <Button
                            variant="secondary"
                            className="!p-2 h-8 w-8"
                            onClick={() => { setUsuarioIdSelecionado(user.id); setModo('editando'); }}
                            icon={<IconeEditar />}
                          />

                          <Button
                            variant="danger"
                            className="!p-2 h-8 w-8"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteMutation.isPending || user.id === adminUserId}
                            icon={<IconeLixo />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODAIS --- */}

      {/* Modal de QR Code */}
      {modalQrOpen && tokenQr && (
        <ModalQrCode token={tokenQr} nomeUsuario={nomeQr} onClose={() => { setModalQrOpen(false); setTokenQr(null); }} />
      )}

      {/* Modal de Treinamentos e Certificados */}
      {usuarioParaTreinamento && (
        <ModalTreinamentosUsuario
          usuario={usuarioParaTreinamento}
          onClose={() => setUsuarioParaTreinamento(null)}
        />
      )}
    </div>
  );
}