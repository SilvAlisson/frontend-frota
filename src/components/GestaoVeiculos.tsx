import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';
import { Button } from './ui/Button';
import { TableStyles } from '../styles/table';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  tipoVeiculo: string | null;
  vencimentoCiv: string | null;
  vencimentoCipp: string | null;
}

interface GestaoVeiculosProps {
  // Token removido
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

export function GestaoVeiculos({ }: GestaoVeiculosProps) {

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [veiculoIdSelecionado, setVeiculoIdSelecionado] = useState<string | null>(null);

  const fetchVeiculos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/veiculos');
      setVeiculos(response.data);
    } catch (err) {
      setError('Falha ao carregar veículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const handleDelete = async (veiculoId: string) => {
    if (!window.confirm("Tem a certeza que quer REMOVER este veículo? Esta ação pode falhar se ele tiver registos associados.")) {
      return;
    }

    setDeletingId(veiculoId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/veiculo/${veiculoId}`);
      setSuccess('Veículo removido com sucesso.');
      fetchVeiculos(); // Atualiza a lista
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover veículo.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleAbrirEdicao = (veiculoId: string) => {
    setVeiculoIdSelecionado(veiculoId);
    setModo('editando');
    setError('');
    setSuccess('');
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setVeiculoIdSelecionado(null);
    setError('');
    setSuccess('');
  };

  const handleSucesso = () => {
    setModo('listando');
    setVeiculoIdSelecionado(null);
    fetchVeiculos();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">
        Gestão de Veículos
      </h3>

      {error && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200">{error}</p>}
      {success && <p className="text-center text-success bg-green-50 p-3 rounded border border-green-200">{success}</p>}

      {/* Modo de Adição */}
      {modo === 'adicionando' && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormCadastrarVeiculo
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo de Edição */}
      {modo === 'editando' && veiculoIdSelecionado && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarVeiculo
            veiculoId={veiculoIdSelecionado}
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo de Listagem */}
      {modo === 'listando' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <Button
              variant="primary"
              onClick={() => { setModo('adicionando'); setSuccess(''); setError(''); }}
            >
              + Adicionar Novo Veículo
            </Button>

            <Button
              variant="secondary"
              onClick={fetchVeiculos}
            >
              Atualizar Lista
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-primary py-8">A carregar veículos...</p>
          ) : (
            <div className="overflow-x-auto shadow-card rounded-card border border-gray-100 bg-white">
              {veiculos.length === 0 ? (
                <div className={TableStyles.emptyState}>Nenhum veículo cadastrado.</div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={TableStyles.th}>Placa</th>
                      <th className={TableStyles.th}>Modelo</th>
                      <th className={TableStyles.th}>Ano</th>
                      <th className={TableStyles.th}>Tipo</th>
                      <th className={TableStyles.th}>Vencimentos</th>
                      <th className={TableStyles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {veiculos.map((veiculo) => (
                      <tr key={veiculo.id} className={TableStyles.rowHover}>
                        <td className={TableStyles.td + " font-medium"}>{veiculo.placa}</td>
                        <td className={TableStyles.td}>{veiculo.modelo}</td>
                        <td className={TableStyles.td}>{veiculo.ano}</td>
                        <td className={TableStyles.td}>{veiculo.tipoVeiculo || '---'}</td>
                        <td className={TableStyles.td}>
                          <div className="flex flex-col text-xs">
                            {veiculo.vencimentoCiv && <span>CIV: {new Date(veiculo.vencimentoCiv).toLocaleDateString()}</span>}
                            {veiculo.vencimentoCipp && <span>CIPP: {new Date(veiculo.vencimentoCipp).toLocaleDateString()}</span>}
                            {!veiculo.vencimentoCiv && !veiculo.vencimentoCipp && <span className="text-gray-400">---</span>}
                          </div>
                        </td>
                        <td className={TableStyles.td}>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              className={TableStyles.actionButton}
                              onClick={() => handleAbrirEdicao(veiculo.id)}
                              title="Editar"
                              icon={<IconeEditar />}
                            />
                            <Button
                              variant="danger"
                              className={TableStyles.actionButton}
                              onClick={() => handleDelete(veiculo.id)}
                              disabled={deletingId === veiculo.id}
                              title="Remover Veículo"
                              isLoading={deletingId === veiculo.id}
                              icon={<IconeLixo />}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}