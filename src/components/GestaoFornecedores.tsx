import { useState, useEffect } from 'react';
// Importação direta do arquivo do formulário
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';

// --- MOCKS (Para funcionamento isolado) ---
const api = {
  get: (url: string) =>
    new Promise<{ data: any[] }>((resolve) => {
      console.log(`GET ${url}`);
      setTimeout(() => {
        resolve({
          data: [
            { id: '1', nome: 'Posto Shell Central', cnpj: '12.345.678/0001-90' },
            { id: '2', nome: 'Oficina do Zé', cnpj: '' },
          ]
        });
      }, 800);
    }),
  delete: (url: string) =>
    new Promise((resolve) => {
      console.log(`DELETE ${url}`);
      setTimeout(() => resolve({ success: true }), 800);
    })
};

const Button = ({ variant, className, isLoading, icon, children, ...props }: any) => (
  <button
    className={`flex items-center justify-center gap-2 px-3 py-2 rounded font-medium transition-colors ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
      variant === 'danger' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
        variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
          'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
    disabled={isLoading}
    {...props}
  >
    {isLoading ? '...' : <>{icon} {children}</>}
  </button>
);

// --- COMPONENTE GESTÃO FORNECEDORES ---

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
}

export function GestaoFornecedores() {

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [fornecedorIdSelecionado, setFornecedorIdSelecionado] = useState<string | null>(null);

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

  const handleDelete = async (fornecedorId: string) => {
    if (!window.confirm("Tem certeza que quer remover este fornecedor?")) return;

    setDeletingId(fornecedorId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/fornecedor/${fornecedorId}`);
      setSuccess('Fornecedor removido com sucesso.');
      setFornecedores(prev => prev.filter(f => f.id !== fornecedorId));
    } catch (err) {
      setError('Falha ao remover fornecedor.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSucesso = () => {
    setModo('listando');
    setFornecedorIdSelecionado(null);
    fetchFornecedores();
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setFornecedorIdSelecionado(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 min-h-screen">
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        Gestão de Fornecedores
      </h3>

      {error && <p className="text-center text-red-600 bg-red-50 p-3 rounded">{error}</p>}
      {success && <p className="text-center text-green-600 bg-green-50 p-3 rounded">{success}</p>}

      {/* MODO ADICIONAR */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-lg mx-auto">
          <FormCadastrarFornecedor
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* MODO EDITAR (Placeholder para exemplo) */}
      {modo === 'editando' && fornecedorIdSelecionado && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-lg mx-auto text-center">
          <p className="text-gray-500 mb-4">Formulário de Edição para ID: {fornecedorIdSelecionado}</p>
          <Button variant="secondary" onClick={handleCancelarForm}>Cancelar</Button>
        </div>
      )}

      {/* MODO LISTAGEM */}
      {modo === 'listando' && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <Button
              variant="primary"
              onClick={() => { setModo('adicionando'); setSuccess(''); setError(''); }}
            >
              + Novo Fornecedor
            </Button>
            <Button variant="secondary" onClick={fetchFornecedores}>
              Atualizar
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando...</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fornecedores.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{f.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.cnpj || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => { setFornecedorIdSelecionado(f.id); setModo('editando'); }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => handleDelete(f.id)}
                            isLoading={deletingId === f.id}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fornecedores.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                        Nenhum fornecedor encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// App Wrapper
export default function App() {
  return <GestaoFornecedores />;
}