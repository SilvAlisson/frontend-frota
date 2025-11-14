// frontend/src/components/DashboardRelatorios.tsx
// ATUALIZADO: Com filtro de Veículo

import { useState, useEffect } from 'react';
import axios from 'axios';

// Tipos
interface KpiProps {
  titulo: string;
  valor: string;
  descricao: string;
}

// ================== MUDANÇA 1: Adicionar 'veiculos' às props ==================
interface DashboardRelatoriosProps {
  token: string;
  veiculos: any[]; // <-- ADICIONADO: Para popular o dropdown
}
// ================== FIM DA MUDANÇA ==================

interface KpiData {
  custoTotalGeral: number;
  custoTotalCombustivel: number;
  custoTotalAditivo: number;
  custoTotalManutencao: number;
  kmTotalRodado: number;
  litrosTotaisConsumidos: number;
  consumoMedioKML: number;
  custoMedioPorKM: number;
}

// Sub-Componente: Card de KPI (Sem alteração)
function KpiCard({ titulo, valor, descricao }: KpiProps) {
  return (
    <div className="bg-white shadow rounded-lg p-5 text-center border-l-4 border-klin-azul">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{titulo}</h3>
      <p className="mt-1 text-3xl font-bold text-gray-900">{valor}</p>
      <p className="mt-1 text-sm text-gray-500">{descricao}</p>
    </div>
  );
}

// Componente Principal: Dashboard de Relatórios
// ================== MUDANÇA 1 (Cont.): Receber 'veiculos' ==================
export function DashboardRelatorios({ token, veiculos }: DashboardRelatoriosProps) {
  
  // 1. Estados para os filtros
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1); // JS Mês é 0-11
  // ================== MUDANÇA 2: Estado para o filtro de veículo ==================
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(''); // '' significa "Frota Inteira"
  // ================== FIM DA MUDANÇA ==================
  
  // 2. Estados para os dados
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Efeito que busca os dados na API
  useEffect(() => {
    const carregarSumario = async () => {
      setLoading(true);
      setError('');
      try {
        const api = axios.create({
          baseURL: 'https://api-frota-klin.onrender.com',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // ================== MUDANÇA 3: Preparar os parâmetros da API ==================
        const params: any = {
          ano,
          mes
        };
        // Só adiciona o veiculoId se ele não for "Frota Inteira"
        if (veiculoIdFiltro) {
          params.veiculoId = veiculoIdFiltro;
        }
        
        // Chama a nova rota de sumário com os filtros
        const response = await api.get('/relatorio/sumario', { params });
        // ================== FIM DA MUDANÇA ==================
        
        setKpis(response.data.kpis);

      } catch (err) {
        console.error("Erro ao buscar sumário:", err);
        setError('Falha ao carregar relatórios.');
      } finally {
        setLoading(false);
      }
    };

    carregarSumario();
  }, [token, ano, mes, veiculoIdFiltro]); // <-- MUDANÇA 3 (Cont.): Adicionar o novo filtro às dependências

  // 4. Funções de Formatação (Sem alteração)
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatKm = (value: number) => `${value.toFixed(0)} KM`;
  const formatKML = (value: number) => `${value.toFixed(2).replace('.', ',')} KM/L`;
  const formatRperKM = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')} /KM`;

  // 5. Opções dos Filtros (Sem alteração)
  const mesesOptions = [
    { v: 1, n: 'Janeiro' }, { v: 2, n: 'Fevereiro' }, { v: 3, n: 'Março' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Maio' }, { v: 6, n: 'Junho' },
    { v: 7, n: 'Julho' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Setembro' },
    { v: 10, n: 'Outubro' }, { v: 11, n: 'Novembro' }, { v: 12, n: 'Dezembro' },
  ];
  const anosOptions = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  return (
    <div className="space-y-6">
      {/* 6. Filtros de Data */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mês</label>
          <select 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {mesesOptions.map(m => (
              <option key={m.v} value={m.v}>{m.n}</option>
            ))}
          </select>
        </div>
         <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Ano</label>
          <select 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
             {anosOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        {/* ================== MUDANÇA 4: Adicionar o dropdown de Veículo ================== */}
        <div className="flex-grow">
          <label className="block text-sm font-bold text-gray-700 mb-1">Veículo</label>
          <select 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul"
            value={veiculoIdFiltro}
            onChange={(e) => setVeiculoIdFiltro(e.target.value)}
          >
            <option value="">-- Frota Inteira --</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
            ))}
          </select>
        </div>
        {/* ================== FIM DA MUDANÇA ================== */}

      </div>

      {/* 7. Conteúdo (Loading, Erro ou KPIs) - (Sem alteração) */}
      {loading && <p className="text-center text-klin-azul">A carregar KPIs...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {kpis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Linha 1 */}
          <KpiCard 
            titulo="Custo Total (Geral)"
            valor={formatCurrency(kpis.custoTotalGeral)}
            descricao="Combustível + Aditivo + Manutenção"
          />
          <KpiCard 
            titulo="KM Total Rodado"
            valor={formatKm(kpis.kmTotalRodado)}
            descricao="Soma de todas as jornadas"
          />
          <KpiCard 
            titulo="Custo Médio por KM"
            valor={formatRperKM(kpis.custoMedioPorKM)}
            descricao="Custo Geral / KM Rodado"
          />
          <KpiCard 
            titulo="Consumo Médio"
            valor={formatKML(kpis.consumoMedioKML)}
            descricao="KM Rodado / Litros (Combustível)"
          />
          
          {/* Linha 2 */}
           <KpiCard 
            titulo="Custo (Combustível)"
            valor={formatCurrency(kpis.custoTotalCombustivel)}
            descricao="Total em Diesel, etc."
          />
           <KpiCard 
            titulo="Custo (Aditivos)"
            valor={formatCurrency(kpis.custoTotalAditivo)}
            descricao="Total em Arla32, etc."
          />
           <KpiCard 
            titulo="Custo (Manutenção)"
            valor={formatCurrency(kpis.custoTotalManutencao)}
            descricao="Total de OS e Lavagens"
          />
        </div>
      )}
    </div>
  );
}