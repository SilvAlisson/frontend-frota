import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';
import { FormEditarFornecedor } from './forms/FormEditarFornecedor';

// Tipos
interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
}
interface GestaoFornecedoresProps {
  token: string;
}

// Estilos
const thStyle = "px-4 py-2 text-left text-sm font-semibold text-gray-700 bg-gray-100 border-b";
const tdStyle = "px-4 py-2 text-sm text-gray-800 border-b";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed";
const dangerButton = "bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline disabled:opacity-50";
const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline";

// Ícone
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

export function GestaoFornecedores({ token }: GestaoFornecedoresProps) {
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fornecedorIdSelecionado, setFornecedorIdSelecionado] = useState<string | null>(null);

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 1. Buscar
  const fetchFornecedores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/fornecedores');
      setFornecedores(response.data);
    } catch (err) {
      setError('Falha ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  // 2. Apagar
  const handleDelete = async (fornecedorId: string) => {
    if (!window.confirm("Tem a certeza que quer REMOVER este fornecedor? Esta ação pode falhar se ele estiver a ser usado em algum registo.")) {
      return;
    }

    setDeletingId(fornecedorId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/fornecedor/${fornecedorId}`);
      setSuccess('Fornecedor removido com sucesso.');
      fetchFornecedores(); // Atualiza a lista
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover fornecedor.');
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  // 3. Controladores de estado (Modo)
  const handleAbrirEdicao = (fornecedorId: string) => {
    setFornecedorIdSelecionado(fornecedorId);
    setModo('editando');
    setError('');
    setSuccess('');
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setFornecedorIdSelecionado(null);
    setError('');
    setSuccess('');
  };
  
  const handleFornecedorAdicionado = () => {
    setSuccess('Fornecedor adicionado com sucesso!');
    setModo('listando');
    fetchFornecedores();
  };

  const handleFornecedorEditado = () => {
    setSuccess('Fornecedor atualizado com sucesso!');
    setModo('listando');
    setFornecedorIdSelecionado(null);
    fetchFornecedores();
  };

  // Renderização
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-klin-azul text-center">
        Gestão de Fornecedores (Postos/Oficinas)
      </h3>

      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded border border-red-400">{error}</p>}
      {success && <p className="text-center text-green-600 bg-green-100 p-3 rounded border border-green-400">{success}</p>}

      {/* Modo de Adição (Formulário) */}
      {modo === 'adicionando' && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <FormCadastrarFornecedor
            token={token} 
            onFornecedorAdicionado={handleFornecedorAdicionado}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo de Edição (Formulário) */}
      {modo === 'editando' && fornecedorIdSelecionado && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <FormEditarFornecedor
            token={token}
            fornecedorId={fornecedorIdSelecionado}
            onFornecedorEditado={handleFornecedorEditado}
            onCancelar={handleCancelarForm}
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
              + Adicionar Novo Fornecedor
            </button>
          </div>

          {loading ? (
            <p className="text-center text-klin-azul">A carregar fornecedores...</p>
          ) : (
            <div className="overflow-x-auto shadow rounded-lg border">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={thStyle}>Nome</th>
                    <th className={thStyle}>CNPJ</th>
                    <th className={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {fornecedores.map((f) => (
                    <tr key={f.id}>
                      <td className={tdStyle}>{f.nome}</td>
                      <td className={tdStyle}>{f.cnpj || '---'}</td>
                      <td className={tdStyle}>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            className={secondaryButton}
                            onClick={() => handleAbrirEdicao(f.id)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={dangerButton}
                            onClick={() => handleDelete(f.id)}
                            disabled={deletingId === f.id}
                            title="Remover Fornecedor"
                          >
                            {deletingId === f.id ? '...' : <IconeLixo />}
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