import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';
import { Button } from './ui/Button';
import type { Veiculo } from '../types';

const thStyle = "px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider bg-gray-50 border-b border-gray-100";
const tdStyle = "px-4 py-3 text-sm text-text border-b border-gray-50 align-middle";

// Ícones
function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}

// Interface Vazia ou com Props futuras (token removido)
interface GestaoVeiculosProps {
  // Token removido pois usamos a instância global 'api'
}

export function GestaoVeiculos({ }: GestaoVeiculosProps) {
  const queryClient = useQueryClient();

  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [veiculoIdSelecionado, setVeiculoIdSelecionado] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. BUSCAR VEÍCULOS (React Query)
  const { data: veiculos = [], isLoading } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: async () => {
      const response = await api.get('/veiculos');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. DELETAR VEÍCULO (Mutation)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/veiculo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      setErrorMsg('');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Falha ao remover veículo.';
      setErrorMsg(msg);
    }
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem a certeza que quer REMOVER este veículo?")) return;
    deleteMutation.mutate(id);
  };

  const handleAbrirEdicao = (id: string) => {
    setVeiculoIdSelecionado(id);
    setModo('editando');
    setErrorMsg('');
  };

  const handleVoltar = () => {
    setModo('listando');
    setVeiculoIdSelecionado(null);
    setErrorMsg('');
    queryClient.invalidateQueries({ queryKey: ['veiculos'] });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">
        Gestão de Veículos
      </h3>

      {errorMsg && <div className="p-3 bg-red-50 text-error border border-red-200 rounded text-center text-sm">{errorMsg}</div>}

      {/* MODO ADIÇÃO */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">
          <FormCadastrarVeiculo onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {/* MODO EDIÇÃO */}
      {modo === 'editando' && veiculoIdSelecionado && (
        <div className="bg-white p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarVeiculo veiculoId={veiculoIdSelecionado} onSuccess={handleVoltar} onCancelar={handleVoltar} />
        </div>
      )}

      {/* MODO LISTAGEM */}
      {modo === 'listando' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <Button variant="primary" onClick={() => setModo('adicionando')}>
              + Novo Veículo
            </Button>

            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['veiculos'] })}
              disabled={isLoading}
            >
              Atualizar Lista
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-text-secondary text-sm">A carregar frota...</p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-card rounded-card border border-gray-100 bg-white">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={thStyle}>Placa</th>
                    <th className={thStyle}>Modelo</th>
                    <th className={thStyle}>Ano</th>
                    <th className={thStyle}>Tipo</th>
                    <th className={thStyle}>Vencimentos</th>
                    <th className={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {veiculos.map((veiculo) => (
                    <tr key={veiculo.id} className="hover:bg-gray-50 transition-colors">
                      <td className={tdStyle + " font-medium"}>{veiculo.placa}</td>
                      <td className={tdStyle}>{veiculo.modelo}</td>
                      <td className={tdStyle}>{veiculo.ano}</td>
                      <td className={tdStyle}>{veiculo.tipoVeiculo || '-'}</td>
                      <td className={tdStyle}>
                        <div className="flex flex-col text-xs">
                          {veiculo.vencimentoCiv && (
                            <span className={new Date(veiculo.vencimentoCiv) < new Date() ? "text-red-500 font-bold" : ""}>
                              CIV: {new Date(veiculo.vencimentoCiv).toLocaleDateString()}
                            </span>
                          )}
                          {veiculo.vencimentoCipp && (
                            <span className={new Date(veiculo.vencimentoCipp) < new Date() ? "text-red-500 font-bold" : ""}>
                              CIPP: {new Date(veiculo.vencimentoCipp).toLocaleDateString()}
                            </span>
                          )}
                          {!veiculo.vencimentoCiv && !veiculo.vencimentoCipp && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className={tdStyle}>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="!p-2 h-8 w-8"
                            onClick={() => handleAbrirEdicao(veiculo.id)}
                            title="Editar"
                            icon={<IconeEditar />}
                          />
                          <Button
                            variant="danger"
                            className="!p-2 h-8 w-8"
                            onClick={() => handleDelete(veiculo.id)}
                            disabled={deleteMutation.isPending}
                            title="Remover"
                            icon={<IconeLixo />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {veiculos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-text-secondary">
                        Nenhum veículo encontrado.
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