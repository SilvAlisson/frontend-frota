import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';
import { FormEditarFornecedor } from './forms/FormEditarFornecedor';
import { Button } from './ui/Button';
import { TableStyles } from '../styles/table';
// Ajuste: Importação explícita de tipo para evitar erro de verbatimModuleSyntax
import type { Fornecedor } from '../types';

// Ícones
function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}
function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
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
      // Endpoint real
      const response = await api.get<Fornecedor[]>('/fornecedor');
      setFornecedores(response.data);
    } catch (err) {
      console.error(err);
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
    } catch (err: any) {
      console.error(err);
      // Tratamento de erro vindo do backend (ex: chave estrangeira)
      const msg = err.response?.data?.error || 'Falha ao remover fornecedor.';
      setError(msg);
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
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">
        Gestão de Fornecedores
      </h3>

      {error && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200 text-sm">{error}</p>}
      {success && <p className="text-center text-success bg-green-50 p-3 rounded border border-green-200 text-sm">{success}</p>}

      {/* MODO ADICIONAR */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100 max-w-lg mx-auto">
          <FormCadastrarFornecedor
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* MODO EDITAR */}
      {modo === 'editando' && fornecedorIdSelecionado && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100 max-w-lg mx-auto">
          <FormEditarFornecedor
            fornecedorId={fornecedorIdSelecionado}
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* MODO LISTAGEM */}
      {modo === 'listando' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <Button
              variant="primary"
              onClick={() => { setModo('adicionando'); setSuccess(''); setError(''); }}
            >
              + Novo Fornecedor
            </Button>
            <Button variant="secondary" onClick={fetchFornecedores} title="Recarregar lista">
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-hidden shadow-card rounded-card border border-gray-100 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={TableStyles.th}>Nome</th>
                    <th className={TableStyles.th}>CNPJ</th>
                    <th className={TableStyles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {fornecedores.map((f) => (
                    <tr key={f.id} className={TableStyles.rowHover}>
                      <td className={TableStyles.td + " font-medium"}>{f.nome}</td>
                      <td className={TableStyles.td}>{f.cnpj || '-'}</td>
                      <td className={TableStyles.td}>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="!p-2 h-8 w-8"
                            onClick={() => { setFornecedorIdSelecionado(f.id); setModo('editando'); }}
                            title="Editar"
                            icon={<IconeEditar />}
                          />
                          <Button
                            variant="danger"
                            className="!p-2 h-8 w-8"
                            onClick={() => handleDelete(f.id)}
                            isLoading={deletingId === f.id}
                            title="Remover"
                            icon={<IconeLixo />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fornecedores.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-text-secondary">
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