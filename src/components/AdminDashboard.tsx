import { useState } from 'react';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormCadastrarUsuario } from './forms/FormCadastrarUsuario';
import { FormCadastrarProduto } from './forms/FormCadastrarProduto';
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao'; 
import { DashboardRelatorios } from './DashboardRelatorios';
import { FormPlanoManutencao } from './forms/FormPlanoManutencao';
import { PainelAlertas } from './PainelAlertas';
import { RankingOperadores } from './RankingOperadores';


// Tipos
interface AdminDashboardProps {
  token: string;
  veiculos: any[];
  produtos: any[];
  fornecedores: any[];
}

// ================== Adicionar 'ranking' às abas ==================
type AbaAdmin = 'alertas' | 'dashboard' | 'ranking' | 'veiculo' | 'usuario' | 'produto' | 'fornecedor' | 'manutencao' | 'planos';

// Estilos das abas 
const abaAtivaStyle = "inline-block p-4 text-klin-azul border-b-2 border-klin-azul rounded-t-lg active";
const abaInativaStyle = "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300";


export function AdminDashboard({ 
  token, 
  veiculos, 
  produtos, 
  fornecedores 
}: AdminDashboardProps) {

  // Estado da aba 
  const [abaAtiva, setAbaAtiva] = useState<AbaAdmin>('alertas');

  // 2. Função para renderizar o conteúdo da aba correta
  const renderAbaConteudo = () => {
    switch (abaAtiva) {
      case 'alertas':
        return <PainelAlertas token={token} />;
      case 'dashboard':
        return <DashboardRelatorios token={token} veiculos={veiculos} />;
      
      // ================== Adicionar o 'case' do ranking ==================
      case 'ranking':
        return <RankingOperadores token={token} />;
        
      case 'veiculo':
        return <FormCadastrarVeiculo token={token} />;
      case 'usuario':
        return <FormCadastrarUsuario token={token} />;
      case 'produto':
        return <FormCadastrarProduto token={token} />;
      case 'fornecedor':
        return <FormCadastrarFornecedor token={token} />;
      case 'manutencao':
        return (
          <FormRegistrarManutencao
            token={token}
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
          />
        );
      case 'planos':
        return (
          <FormPlanoManutencao
            token={token}
            veiculos={veiculos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      
      {/* 4. Os botões das Abas */}
      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px">
          
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'alertas' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('alertas')}
            >
              Alertas
            </button>
          </li>
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'dashboard' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('dashboard')}
            >
              Dashboard (KPIs)
            </button>
          </li>
          
          {/* ================== Adicionar o botão da aba ================== */}
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'ranking' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('ranking')}
            >
              Ranking (KM/L)
            </button>
          </li>
          {}

          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'veiculo' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('veiculo')}
            >
              Veículos
            </button>
          </li>
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'usuario' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('usuario')}
            >
              Usuários
            </button>
          </li>
           <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'produto' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('produto')}
            >
              Produtos
            </button>
          </li>
           <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'fornecedor' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('fornecedor')}
            >
              Fornecedores
            </button>
          </li>
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'manutencao' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('manutencao')}
            >
              Manutenção/Lavagem
            </button>
          </li>
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'planos' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('planos')}
            >
              Planos Preventivos
            </button>
          </li>
        </ul>
      </div>

      {/* 5. O conteúdo da aba ativa */}
      <div>
        {renderAbaConteudo()}
      </div>

    </div>
  );
}