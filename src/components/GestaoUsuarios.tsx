import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';

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
  adminUserId: string; // ID do admin logado, para evitar auto-deleção
}

// Estilos
const thStyle = "px-4 py-2 text-left text-sm font-semibold text-gray-700 bg-gray-100 border-b";
const tdStyle = "px-4 py-2 text-sm text-gray-800 border-b";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed";
const dangerButton = "bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline disabled:opacity-50";
const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline";

// Ícone de Lixo
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

export function GestaoUsuarios({ token, adminUserId }: GestaoUsuariosProps) {
  
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Função para buscar os utilizadores
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

  // Buscar ao carregar o componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Função para lidar com a deleção
  const handleDelete = async (userId: string) => {
    if (userId === adminUserId) {
      setError('Não pode remover o seu próprio utilizador.');
      return;
    }
    if (!window.confirm("Tem a certeza que quer REMOVER este utilizador? Esta ação pode falhar se ele tiver registos associados.")) {
      return;
    }

    setDeletingId(userId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/user/${userId}`);
      setSuccess('Utilizador removido com sucesso.');
      // Atualiza a lista
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
  
  // Callback para quando um novo utilizador é adicionado
  const handleUsuarioAdicionado = () => {
    setSuccess('Utilizador adicionado com sucesso!');
    setModo('listando');
    fetchUsuarios(); // Re-busca a lista
  };

  // Renderização principal
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-klin-azul text-center">
        Gestão de Utilizadores
      </h3>

      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded border border-red-400">{error}</p>}
      {success && <p className="text-center text-green-600 bg-green-100 p-3 rounded border border-green-400">{success}</p>}

      {/* Modo de Adição (Formulário) */}
      {modo === 'adicionando' && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <FormCadastrarUsuario 
            token={token} 
            onUsuarioAdicionado={handleUsuarioAdicionado}
            onCancelar={() => setModo('listando')}
          />
        </div>
      )}

      {/* Modo de Listagem (Tabela) */}
      {modo === 'listando' && (
        <div>
          <div className="mb-4">
            <button
              type="button"
              className={buttonStyle}
              onClick={() => { setModo('adicionando'); setSuccess(''); setError(''); }}
            >
              + Adicionar Novo Utilizador
            </button>
          </div>

          {loading ? (
            <p className="text-center text-klin-azul">A carregar utilizadores...</p>
          ) : (
            <div className="overflow-x-auto shadow rounded-lg border">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={thStyle}>Nome</th>
                    <th className={thStyle}>Email</th>
                    <th className={thStyle}>Matrícula</th>
                    <th className={thStyle}>Função (Role)</th>
                    <th className={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {usuarios.map((user) => (
                    <tr key={user.id}>
                      <td className={tdStyle}>{user.nome}</td>
                      <td className={tdStyle}>{user.email}</td>
                      <td className={tdStyle}>{user.matricula || '---'}</td>
                      <td className={tdStyle}>
                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                           user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                           user.role === 'ENCARREGADO' ? 'bg-blue-100 text-blue-800' :
                           'bg-green-100 text-green-800'
                         }`}>
                           {user.role}
                         </span>
                      </td>
                      <td className={tdStyle}>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            className={secondaryButton + " text-xs py-1 px-2"}
                            onClick={() => alert("Funcionalidade 'Editar' será implementada no próximo passo.")}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={dangerButton}
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id || user.id === adminUserId}
                            title={user.id === adminUserId ? "Não pode remover a si mesmo" : "Remover Utilizador"}
                          >
                            {deletingId === user.id ? '...' : <IconeLixo />}
                          </button>
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
    </div>
  );
}