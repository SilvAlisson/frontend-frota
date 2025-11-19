import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormEditarUsuario } from './forms/FormEditarUsuario';
import { exportarParaExcel } from '../utils';
import { ModalQrCode } from './ModalQrCode';
// MUDANÇA: Importar o novo Botão
import { Button } from './ui/Button';

// Tipos
interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  role: 'ADMIN' | 'ENCARREGADO' | 'OPERADOR';
}
interface GestaoUsuariosProps {
  token: string;
  adminUserId: string;
}

// Estilos da Tabela (Novo Design)
const thStyle = "px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider bg-gray-50 border-b border-gray-100";
const tdStyle = "px-4 py-3 text-sm text-text border-b border-gray-50 align-middle";

// Ícones
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

function IconeQrCode() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5ZM14.25 15a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" />
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


export function GestaoUsuarios({ token, adminUserId }: GestaoUsuariosProps) {
  
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [usuarioIdSelecionado, setUsuarioIdSelecionado] = useState<string | null>(null);

  // Estados para o Modal QR Code
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [loadingQr, setLoadingQr] = useState<string | null>(null); 
  const [tokenParaQr, setTokenParaQr] = useState<string | null>(null);
  const [nomeParaQr, setNomeParaQr] = useState<string>('');

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      setUsuarios(response.data);
    } catch (err) {
      setError('Falha ao carregar utilizadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleDelete = async (userId: string) => {
    if (userId === adminUserId) {
      setError('Não pode remover o seu próprio utilizador.');
      return;
    }
    if (!window.confirm("Tem a certeza que quer REMOVER este utilizador?")) {
      return;
    }
    setDeletingId(userId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/user/${userId}`);
      setSuccess('Utilizador removido com sucesso.');
      setUsuarios(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover utilizador.');
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleAbrirEdicao = (userId: string) => {
    setUsuarioIdSelecionado(userId);
    setModo('editando');
    setError('');
    setSuccess('');
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setUsuarioIdSelecionado(null);
    setError('');
    setSuccess('');
  };
  
  const handleUsuarioAdicionado = () => {
    setSuccess('Utilizador adicionado com sucesso!');
    setModo('listando');
    fetchUsuarios();
  };

  const handleUsuarioEditado = () => {
    setSuccess('Utilizador atualizado com sucesso!');
    setModo('listando');
    setUsuarioIdSelecionado(null);
    fetchUsuarios();
  };

  const handleExportar = () => {
    setError('');
    setSuccess('');
    try {
      const dadosFormatados = usuarios.map(u => ({
        'Nome': u.nome,
        'Email': u.email,
        'Matrícula': u.matricula || '---',
        'Função': u.role,
      }));
      exportarParaExcel(dadosFormatados, "Lista_Usuarios_Frota.xlsx");
      setSuccess('Lista de utilizadores exportada com sucesso!');
    } catch (err) {
      setError('Ocorreu um erro ao preparar os dados para exportação.');
      console.error(err);
    }
  };

  const handleGerarQrCode = async (userId: string, nome: string) => {
    setLoadingQr(userId); 
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/user/${userId}/generate-login-token`);
      const { loginToken } = response.data;
      
      if (!loginToken) {
        throw new Error("API não retornou um token de login.");
      }
      setTokenParaQr(loginToken);
      setNomeParaQr(nome);
      setModalQrOpen(true);

    } catch (err) {
      console.error("Erro ao gerar token QR:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao gerar o token de login para este operador.');
      }
    } finally {
      setLoadingQr(null);
    }
  };


  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">
        Gestão de Utilizadores
      </h3>

      {error && <p className="text-center text-error bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
      {success && <p className="text-center text-success bg-green-50 p-3 rounded-md border border-green-200">{success}</p>}

      {/* Modo Adição */}
      {modo === 'adicionando' && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormCadastrarUsuario 
            token={token} 
            onUsuarioAdicionado={handleUsuarioAdicionado}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}
      
      {/* Modo Edição */}
      {modo === 'editando' && usuarioIdSelecionado && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarUsuario
            token={token}
            userId={usuarioIdSelecionado}
            onUsuarioEditado={handleUsuarioEditado}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo Listagem */}
      {modo === 'listando' && (
        <div>
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap gap-3 justify-between items-center">
            <Button
              variant="primary"
              onClick={() => { setModo('adicionando'); setSuccess(''); setError(''); }}
            >
              + Adicionar Utilizador
            </Button>

            <Button
              variant="success"
              className="text-sm"
              onClick={handleExportar}
              disabled={usuarios.length === 0}
            >
              Exportar Excel
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-primary py-8">A carregar utilizadores...</p>
          ) : (
            <div className="overflow-hidden shadow-card rounded-card border border-gray-100 bg-white">
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
                      <td className={tdStyle + " text-text-secondary"}>{user.email}</td>
                      <td className={tdStyle}>{user.matricula || '---'}</td>
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
                          
                          {/* Botão QR Code (Apenas Operadores) */}
                          {user.role === 'OPERADOR' && (
                            <Button
                              variant="secondary"
                              className="!p-2 h-8 w-8" // Estilo compacto
                              onClick={() => handleGerarQrCode(user.id, user.nome)}
                              disabled={loadingQr === user.id}
                              title="Gerar Token (QR Code)"
                              isLoading={loadingQr === user.id}
                              icon={<IconeQrCode />}
                            />
                          )}
                          
                          {/* Botão Editar */}
                          <Button 
                            variant="secondary"
                            className="!p-2 h-8 w-8"
                            onClick={() => handleAbrirEdicao(user.id)}
                            title="Editar"
                            icon={<IconeEditar />}
                          />
                          
                          {/* Botão Apagar */}
                          <Button
                            variant="danger"
                            className="!p-2 h-8 w-8"
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id || user.id === adminUserId}
                            title="Remover"
                            isLoading={deletingId === user.id}
                            icon={<IconeLixo />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Modal QR Code */}
      {modalQrOpen && tokenParaQr && (
        <ModalQrCode
          token={tokenParaQr}
          nomeUsuario={nomeParaQr}
          onClose={() => {
            setModalQrOpen(false);
            setTokenParaQr(null);
            setNomeParaQr('');
          }}
        />
      )}
    </div>
  );
}