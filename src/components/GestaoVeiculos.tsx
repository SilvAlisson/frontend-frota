import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import type { Veiculo } from '../types';

// Ícones minimalistas (Lucide Style)
function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}

// Helper Visual de Status (Cores OKLCH do tema)
const getDocStatus = (dataVencimento: string | null | undefined) => {
  if (!dataVencimento) return { label: 'N/A', classes: 'bg-gray-100 text-gray-400 border-gray-200' };

  const hoje = new Date();
  const venc = new Date(dataVencimento);
  const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  // Data formatada para tooltip
  const dataFmt = venc.toLocaleDateString('pt-BR');

  if (diffDias < 0) return { label: `VENCIDO (${dataFmt})`, classes: 'bg-red-50 text-red-700 border-red-200 font-bold' };
  if (diffDias < 30) return { label: `VENCE EM ${diffDias} DIAS`, classes: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' };
  return { label: 'EM DIA', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
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
    const promise = api.delete(`/veiculos/${veiculoId}`);

    toast.promise(promise, {
      loading: 'Removendo...',
      success: () => {
        setVeiculos(prev => prev.filter(v => v.id !== veiculoId));
        setDeletingId(null);
        return 'Veículo removido.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover.';
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER DE COMANDO (Glass Panel) */}
      <div className="glass-panel p-1 rounded-xl sticky top-0 z-10 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-white/50 rounded-lg">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-2">
              Frota Ativa
            </h3>
            <p className="text-[10px] text-gray-400 pl-2 font-mono">
              {veiculos.length} {veiculos.length === 1 ? 'Unidade' : 'Unidades'} Registradas
            </p>
          </div>

          {modo === 'listando' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={fetchVeiculos}
                className="shadow-sm bg-white border border-gray-200 h-9 text-xs"
                title="Atualizar lista"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
              >
                Atualizar
              </Button>
              <Button
                variant="primary"
                onClick={() => setModo('adicionando')}
                className="shadow-md shadow-primary/20 h-9 text-xs"
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
      </div>

      {/* FORMULÁRIOS (Em Cards Centralizados) */}
      {modo === 'adicionando' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-float border border-gray-100 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
          <FormCadastrarVeiculo onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {modo === 'editando' && veiculoIdSelecionado && (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-float border border-gray-100 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
          <FormEditarVeiculo veiculoId={veiculoIdSelecionado} onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {/* LISTAGEM (GRID INDUSTRIAL) */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {veiculos.map((veiculo) => (
                <div key={veiculo.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-float hover:border-primary/30 transition-all duration-300 flex flex-col relative">
                  
                  {/* Etiqueta de Tipo (Canto Superior Direito) */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full bg-gray-50">
                      {veiculo.tipoVeiculo || 'FROTA'}
                    </span>
                  </div>

                  {/* Identificação Principal */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                      <div>
                        {/* PLACA COM FONTE MONO (Estilo Chapa) */}
                        <h4 className="font-mono font-bold text-lg text-gray-900 leading-none">
                          {veiculo.placa}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium">ID DA FROTA</span>
                      </div>
                    </div>
                    
                    <div className="pl-1">
                      <p className="text-sm font-medium text-gray-700 truncate" title={veiculo.modelo}>
                        {veiculo.modelo}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ano {veiculo.ano}
                      </p>
                    </div>
                  </div>

                  {/* Status de Documentação (Badges de Alerta) */}
                  <div className="mt-auto space-y-2 py-3 border-t border-gray-50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">CIV</span>
                      {(() => {
                        const status = getDocStatus(veiculo.vencimentoCiv);
                        return <span className={`px-2 py-0.5 rounded text-[10px] border ${status.classes}`}>{status.label}</span>;
                      })()}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">CIPP</span>
                      {(() => {
                        const status = getDocStatus(veiculo.vencimentoCipp);
                        return <span className={`px-2 py-0.5 rounded text-[10px] border ${status.classes}`}>{status.label}</span>;
                      })()}
                    </div>
                  </div>

                  {/* Ações (Slide Up no Hover) */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex justify-end gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <button
                      onClick={() => { setVeiculoIdSelecionado(veiculo.id); setModo('editando'); }}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                    >
                      <IconeEditar /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(veiculo.id)}
                      disabled={deletingId === veiculo.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                    >
                      {deletingId === veiculo.id ? '...' : <><IconeLixo /> Excluir</>}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

          {!loading && veiculos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
              <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h4 className="text-gray-900 font-bold">Frota Vazia</h4>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Comece cadastrando seus veículos para monitorar a operação.
              </p>
              <Button
                variant="ghost"
                onClick={() => setModo('adicionando')}
                className="mt-4 text-primary bg-primary/5 hover:bg-primary/10"
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