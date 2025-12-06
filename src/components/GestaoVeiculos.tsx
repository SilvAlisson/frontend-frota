import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import type { Veiculo } from '../types';

function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}

// Helper para calcular status do documento
const getDocStatus = (dataVencimento: string | null | undefined) => {
  if (!dataVencimento) return { label: 'N/A', color: 'bg-gray-100 text-gray-400 border-gray-200' };

  const hoje = new Date();
  const venc = new Date(dataVencimento);
  const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return { label: 'VENCIDO', color: 'bg-red-50 text-red-600 border-red-100' };
  if (diffDias < 30) return { label: 'A VENCER', color: 'bg-amber-50 text-amber-600 border-amber-100' };
  return { label: 'EM DIA', color: 'bg-green-50 text-green-600 border-green-100' };
};

export function GestaoVeiculos() {

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [veiculoIdSelecionado, setVeiculoIdSelecionado] = useState<string | null>(null);

  const fetchVeiculos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/veiculos');
      setVeiculos(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao carregar a frota.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const handleDelete = async (veiculoId: string) => {
    if (!window.confirm("ATENÇÃO: Remover este veículo apagará todo o histórico associado. Continuar?")) return;

    setDeletingId(veiculoId);

    const promise = api.delete(`/veiculo/${veiculoId}`);

    toast.promise(promise, {
      loading: 'Removendo veículo...',
      success: () => {
        setVeiculos(prev => prev.filter(v => v.id !== veiculoId));
        setDeletingId(null);
        return 'Veículo removido da frota.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover. Verifique dependências.';
      }
    });
  };

  const handleSucesso = () => {
    setModo('listando');
    setVeiculoIdSelecionado(null);
    fetchVeiculos();
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setVeiculoIdSelecionado(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Frota de Veículos
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie os caminhões, utilitários e equipamentos.
          </p>
        </div>

        {modo === 'listando' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={fetchVeiculos}
              className="shadow-sm bg-white"
              title="Atualizar lista"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
            >
              Atualizar
            </Button>
            <Button
              variant="primary"
              onClick={() => setModo('adicionando')}
              className="shadow-lg shadow-primary/20"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Novo Veículo
            </Button>
          </div>
        )}
      </div>

      {/* FORMULÁRIOS */}
      {modo === 'adicionando' && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-2xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormCadastrarVeiculo onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {modo === 'editando' && veiculoIdSelecionado && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-2xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormEditarVeiculo veiculoId={veiculoIdSelecionado} onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {/* LISTAGEM (GRID DE CARDS) */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4"></div>
              <p className="text-primary font-medium animate-pulse">Carregando frota...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {veiculos.map((veiculo) => (
                <div key={veiculo.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col relative overflow-hidden">

                  {/* Topo: Ícone e Ações */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary shadow-sm border border-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => { setVeiculoIdSelecionado(veiculo.id); setModo('editando'); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <IconeEditar />
                      </button>
                      <button
                        onClick={() => handleDelete(veiculo.id)}
                        disabled={deletingId === veiculo.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        {deletingId === veiculo.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <IconeLixo />}
                      </button>
                    </div>
                  </div>

                  {/* Informações Principais */}
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 text-lg tracking-tight bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-200 font-mono">
                      {veiculo.placa}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 font-medium truncate" title={veiculo.modelo}>
                      {veiculo.modelo} <span className="text-gray-300">•</span> {veiculo.ano}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">
                      {veiculo.tipoVeiculo || 'Veículo'}
                    </p>
                  </div>

                  {/* Status de Documentação */}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">CIV</span>
                      {(() => {
                        const status = getDocStatus(veiculo.vencimentoCiv);
                        return (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-0.5 border ${status.color}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">CIPP</span>
                      {(() => {
                        const status = getDocStatus(veiculo.vencimentoCipp);
                        return (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-0.5 border ${status.color}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {!loading && veiculos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">Nenhum veículo encontrado</h4>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Cadastre os veículos para monitorar jornadas e manutenções.
              </p>
              <Button
                variant="ghost"
                onClick={() => setModo('adicionando')}
                className="mt-4 text-primary hover:bg-primary/5"
              >
                Cadastrar Primeiro Veículo
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}