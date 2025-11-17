import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo'; // O que acabámos de criar

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

// Estilos
const thStyle = "px-4 py-2 text-left text-sm font-semibold text-gray-700 bg-gray-100 border-b";
const tdStyle = "px-4 py-2 text-sm text-gray-800 border-b";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed";
const dangerButton = "bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline disabled:opacity-50";
const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline";

// Ícone (pode reutilizar o do GestaoUsuarios, mas copiamos aqui para ser self-contained)
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
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

  // 2. Apagar veículo (usa a nova rota DELETE)
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
  
  // 3. Controladores de estado (Modo)
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
  
  const handleVeiculoAdicionado = () => {
    setSuccess('Veículo adicionado com sucesso!');
    setModo('listando');
    fetchVeiculos(); // Re-busca a lista
  };

  const handleVeiculoEditado = () => {
    setSuccess('Veículo atualizado com sucesso!');
    setModo('listando');
    setVeiculoIdSelecionado(null);
    fetchVeiculos(); // Re-busca a lista
  };

  // Renderização
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-klin-azul text-center">
        Gestão de Veículos
      </h3>

      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded border border-red-400">{error}</p>}
      {success && <p className="text-center text-green-600 bg-green-100 p-3 rounded border border-green-400">{success}</p>}

      {/* Modo de Adição */}
      {modo === 'adicionando' && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="text-lg font-semibold text-klin-azul text-center mb-4">Adicionar Novo Veículo</h4>
          {/* Reutiliza o formulário de cadastro original */}
          <FormCadastrarVeiculo 
            token={token} 
            // O FormCadastrarVeiculo original não tem callbacks, 
            // então usamos o botão cancelar deste componente
          />
          <button type="button" className={secondaryButton + " w-full mt-4"} onClick={handleCancelarForm}>
            Cancelar
          </button>
          {/* Idealmente, o FormCadastrarVeiculo seria refatorado para ter um onSucesso,
              mas para agora, o admin terá de clicar em 'Cancelar' após o sucesso.
              Ou, melhoramos o FormCadastrarVeiculo para ter o callback: */}
          {/* <FormCadastrarVeiculo token={token} onSucesso={handleVeiculoAdicionado} /> */}
        </div>
      )}
      
      {/* (Melhoria: O FormCadastrarVeiculo deveria ser refatorado para aceitar
           onSucesso e onCancelar, assim como fizemos com FormCadastrarUsuario.
           Por agora, vamos assumir que o FormCadastrarVeiculo é o que está no ficheiro)
           Vamos usar a estrutura que funciona: */}
      
      {modo === 'adicionando' && (
         <div className="bg-gray-50 p-4 rounded-lg border">
            {/* O FormCadastrarVeiculo não tem callback de sucesso, então
                teremos que confiar que o Admin clica em Cancelar após o sucesso.
                Para evitar isso, vamos envolvê-lo. Não... vamos usar o que temos.
                O GestaoUsuarios.tsx já alterna o modo. Vamos fazer o GestaoVeiculos
                renderizar o FormCadastrarVeiculo diretamente. */}
            <p className="text-sm text-gray-600 mb-4">O formulário de cadastro de veículo já está abaixo (no modo 'listando'). Cancele esta ação.</p>
             <button type="button" className={secondaryButton + " w-full mt-4"} onClick={handleCancelarForm}>
                Voltar à Listagem
            </button>
         </div>
      )}


      {/* Modo de Edição */}
      {modo === 'editando' && veiculoIdSelecionado && (
        <div className="bg-gray-50 p-4 rounded-lg border">
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
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-lg font-semibold text-klin-azul text-center mb-4">Adicionar Novo Veículo</h4>
            <FormCadastrarVeiculo token={token} />
             {/* O FormCadastrarVeiculo 
                 não tem callback de sucesso. Para atualizar a lista abaixo,
                 teremos que adicionar um botão de refresh manual por enquanto. */}
             <button
                type="button"
                className={secondaryButton + " w-full mt-4"}
                onClick={fetchVeiculos}
             >
                Atualizar Lista de Veículos (após adicionar)
             </button>
          </div>

          <h4 className="text-lg font-semibold text-klin-azul text-center mb-4 pt-4 border-t">Veículos Registados</h4>

          {loading ? (
            <p className="text-center text-klin-azul">A carregar veículos...</p>
          ) : (
            <div className="overflow-x-auto shadow rounded-lg border">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className={thStyle}>Placa</th>
                    <th className={thStyle}>Modelo</th>
                    <th className={thStyle}>Ano</th>
                    <th className={thStyle}>Tipo</th>
                    <th className={thStyle}>Venc. CIV</th>
                    <th className={thStyle}>Venc. CIPP</th>
                    <th className={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {veiculos.map((veiculo) => (
                    <tr key={veiculo.id}>
                      <td className={tdStyle}>{veiculo.placa}</td>
                      <td className={tdStyle}>{veiculo.modelo}</td>
                      <td className={tdStyle}>{veiculo.ano}</td>
                      <td className={tdStyle}>{veiculo.tipoVeiculo || '---'}</td>
                      <td className={tdStyle}>{veiculo.vencimentoCiv || '---'}</td>
                      <td className={tdStyle}>{veiculo.vencimentoCipp || '---'}</td>
                      <td className={tdStyle}>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            className={secondaryButton}
                            onClick={() => handleAbrirEdicao(veiculo.id)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={dangerButton}
                            onClick={() => handleDelete(veiculo.id)}
                            disabled={deletingId === veiculo.id}
                            title="Remover Veículo"
                          >
                            {deletingId === veiculo.id ? '...' : <IconeLixo />}
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