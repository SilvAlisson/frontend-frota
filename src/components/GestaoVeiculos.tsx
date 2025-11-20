import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';
import { Button } from './ui/Button'; // Componente de UI padronizado

// Tipos
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
  token: string;
}

// Estilos da Tabela (Padronizado)
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

function IconeEditar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

export function GestaoVeiculos({ token }: GestaoVeiculosProps) {
  
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [veiculoIdSelecionado, setVeiculoIdSelecionado] = useState<string | null>(null);

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 1. Buscar veículos
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

  // 2. Apagar veículo
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
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover veículo.');
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  // 3. Controladores de estado
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
  
  // O FormCadastrarVeiculo atual não tem callback de sucesso, então o usuário clica em voltar.
  // Se quiséssemos refatorar o FormCadastrarVeiculo depois, poderíamos usar isto:
  // const handleVeiculoAdicionado = () => { ... };

  const handleVeiculoEditado = () => {
    setSuccess('Veículo atualizado com sucesso!');
    setModo('listando');
    setVeiculoIdSelecionado(null);
    fetchVeiculos(); 
  };

  // Renderização
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
          {/* O FormCadastrarVeiculo já tem o título interno */}
          <FormCadastrarVeiculo 
            token={token} 
          />
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full mt-4" 
            onClick={handleCancelarForm}
          >
            Voltar à Listagem
          </Button>
        </div>
      )}

      {/* Modo de Edição */}
      {modo === 'editando' && veiculoIdSelecionado && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarVeiculo
            token={token}
            veiculoId={veiculoIdSelecionado}
            onVeiculoEditado={handleVeiculoEditado}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo de Listagem (Tabela) */}
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
                 <div className="text-center py-10">
                    <p className="text-text-secondary">Nenhum veículo cadastrado.</p>
                 </div>
              ) : (
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
                        <td className={tdStyle}>{veiculo.tipoVeiculo || '---'}</td>
                        <td className={tdStyle}>
                             <div className="flex flex-col text-xs">
                                {veiculo.vencimentoCiv && <span>CIV: {new Date(veiculo.vencimentoCiv).toLocaleDateString()}</span>}
                                {veiculo.vencimentoCipp && <span>CIPP: {new Date(veiculo.vencimentoCipp).toLocaleDateString()}</span>}
                                {!veiculo.vencimentoCiv && !veiculo.vencimentoCipp && <span className="text-gray-400">---</span>}
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