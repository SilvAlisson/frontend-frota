import { useState } from 'react';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao'; 
import { DashboardRelatorios } from './DashboardRelatorios';
import { FormPlanoManutencao } from './forms/FormPlanoManutencao';
import { PainelAlertas } from './PainelAlertas';
import { RankingOperadores } from './RankingOperadores';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { HistoricoManutencoes } from './HistoricoManutencoes';
import { GestaoUsuarios } from './GestaoUsuarios';
import { GestaoVeiculos } from './GestaoVeiculos';
import { GestaoProdutos } from './GestaoProdutos';
import { GestaoFornecedores } from './GestaoFornecedores';

// Tipos
interface AdminDashboardProps {
  token: string;
  veiculos: any[];
  produtos: any[];
  fornecedores: any[];
  adminUserId: string;
}

// ================== Adicionar 'hist_manutencao' às abas ==================
type AbaAdmin = 'alertas' | 'dashboard' | 'ranking' | 'hist_abastecimento' | 'hist_manutencao' | 'veiculo' | 'usuario' | 'produto' | 'fornecedor' | 'manutencao' | 'planos';

// Estilos das abas 
const abaAtivaStyle = "inline-block p-4 text-klin-azul border-b-2 border-klin-azul rounded-t-lg active";
const abaInativaStyle = "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300";

export function AdminDashboard({ 
  token, 
  veiculos, 
  produtos, 
  fornecedores,
  adminUserId
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
      
      case 'ranking':
        return <RankingOperadores token={token} />;
      
      case 'hist_abastecimento':
        return <HistoricoAbastecimentos token={token} userRole="ADMIN" veiculos={veiculos} />;
      
      case 'hist_manutencao':
        return <HistoricoManutencoes token={token} userRole="ADMIN" veiculos={veiculos} />;
        
      case 'veiculo':
        return <GestaoVeiculos token={token} />;
      
      case 'usuario':
        return <GestaoUsuarios token={token} adminUserId={adminUserId} />;

      case 'produto':
        return <GestaoProdutos token={token} />;
      case 'fornecedor':
        return <GestaoFornecedores token={token} />;
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
          
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'ranking' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('ranking')}
            >
              Ranking (KM/L)
            </button>
          </li>
          
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'hist_abastecimento' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('hist_abastecimento')}
            >
              Histórico (Abast.)
            </button>
          </li>
          
          <li className="mr-2">
            <button 
              type="button"
              className={abaAtiva === 'hist_manutencao' ? abaAtivaStyle : abaInativaStyle}
              onClick={() => setAbaAtiva('hist_manutencao')}
            >
              Histórico (Manut.)
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