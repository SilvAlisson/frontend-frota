import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { ModalQrCode } from './ModalQrCode';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import type { User } from '../types';

// Estilos
const thStyle = "px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider bg-gray-50 border-b border-gray-100";
const tdStyle = "px-4 py-3 text-sm text-text border-b border-gray-50 align-middle";

// Ícones
function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}
function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}
function IconeQrCode() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5ZM14.25 15a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" /></svg>;
}

interface GestaoUsuariosProps {
  token: string; // Mantido por compatibilidade
  adminUserId: string;
}

export function GestaoUsuarios({ adminUserId }: GestaoUsuariosProps) {
  const queryClient = useQueryClient();

  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [usuarioIdSelecionado, setUsuarioIdSelecionado] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para QR Code
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [tokenQr, setTokenQr] = useState<string | null>(null);
  const [nomeQr, setNomeQr] = useState('');

  // 1. QUERY: Listar Usuários
  const { data: usuarios = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
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
      const response = await api.post(`/user/${userId}/generate-token`); // Ajuste para a rota correta se necessário
      return response.data.loginToken;
    },
    onError: () => alert("Erro ao gerar QR Code.")
  });

  const handleDelete = async (id: string) => {
    if (id === adminUserId) {
      alert("Não pode remover o seu próprio usuário.");
      return;
    }
    if (!window.confirm("Tem a certeza que quer remover este utilizador?")) return;
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
      <h3 className="text-xl font-semibold text-primary text-center">Gestão de Utilizadores</h3>

      {errorMsg && <div className="p-3 bg-red-50 text-error border border-red-200 rounded text-center text-sm">{errorMsg}</div>}

      {/* MODOS */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">
          <FormCadastrarUsuario onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {modo === 'editando' && usuarioIdSelecionado && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarUsuario userId={usuarioIdSelecionado} onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {modo === 'listando' && (
        <div>
          <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
            <Button variant="primary" onClick={() => setModo('adicionando')}>+ Novo Utilizador</Button>
            <Button variant="success" onClick={handleExportar} disabled={usuarios.length === 0}>Exportar Excel</Button>
          </div>

          {isLoading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
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
                          <Button variant="secondary" className="!p-2 h-8 w-8" onClick={() => { setUsuarioIdSelecionado(user.id); setModo('editando'); }} icon={<IconeEditar />} />
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
                  {usuarios.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">Nenhum utilizador encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalQrOpen && tokenQr && (
        <ModalQrCode token={tokenQr} nomeUsuario={nomeQr} onClose={() => { setModalQrOpen(false); setTokenQr(null); }} />
      )}
    </div>
  );
}