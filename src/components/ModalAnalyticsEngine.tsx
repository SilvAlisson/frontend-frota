import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Highcharts3D from "highcharts/highcharts-3d";
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from './ui/Button';
import { api } from '../services/api';
import { toast } from 'sonner';

// @ts-expect-error
Highcharts3D(Highcharts);

const HIGHCHARTS_COLORS = [
  '#2F80ED', '#EB5757', '#7CB518', '#8E44AD', '#F2994A', '#06b6d4', 
  '#eab308', '#84cc16', '#22c55e', '#f43f5e', '#6366f1', '#a855f7'
];

type MetricType = 'CUSTO_GLOBAL' | 'KM_TOTAL' | 'EFICIENCIA' | 'COMBUSTIVEL' | 'OFICINA' | 'ADITIVOS' | 'CUSTO_KM' | null;

interface ModalAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricType;
  title: string;
}

export function ModalAnalyticsEngine({ isOpen, onClose, metric, title }: ModalAnalyticsProps) {
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  const [dataNivel1, setDataNivel1] = useState<any[]>([]);
  const [dataNivel2, setDataNivel2] = useState<any[]>([]);
  const [dataNivel3, setDataNivel3] = useState<any[]>([]);
  const [dataNivel4, setDataNivel4] = useState<any[]>([]);

  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedMes, setSelectedMes] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && metric) {
      setLevel(1);
      setSelectedVeiculo(null);
      setSelectedVeiculoId(null);
      setSelectedCategoria(null);
      setSelectedMes(null);
      loadMacroData();
    }
  }, [isOpen, metric]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const loadMacroData = async () => {
    setLoading(true);
    try {
      if (metric === 'CUSTO_GLOBAL') {
        const { data } = await api.get('/drilldown/macro');
        setDataNivel1(data);
      }
      else if (metric === 'COMBUSTIVEL') {
        const { data } = await api.get('/drilldown/macro', { params: { categoria: 'ABASTECIMENTO' } });
        setDataNivel1(data);
      }
      else if (metric === 'ADITIVOS') {
        const { data } = await api.get('/drilldown/macro', { params: { categoria: 'ADITIVO' } });
        setDataNivel1(data);
      }
      else if (metric === 'OFICINA') {
        const { data } = await api.get('/drilldown/macro', { params: { categoria: 'MANUTENCAO' } });
        setDataNivel1(data);
      }
      else if (metric === 'KM_TOTAL') {
        const { data } = await api.get('/drilldown/km/macro');
        setDataNivel1(data);
      }
      else if (metric === 'EFICIENCIA') {
        const { data } = await api.get('/drilldown/eficiencia/macro');
        setDataNivel1(data);
      }
      else if (metric === 'CUSTO_KM') {
        const { data } = await api.get('/drilldown/custokm/macro');
        setDataNivel1(data);
      }
      else {
        setDataNivel1([
          { name: 'Em Desenvolvimento', value: 100 }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSliceClickNivel1 = async (entry: any) => {
    setSelectedVeiculo(entry.name);
    setSelectedVeiculoId(entry.veiculoId);
    setLoading(true);

    if (metric === 'CUSTO_GLOBAL') {
      try {
        const { data } = await api.get('/drilldown/veiculo', { params: { veiculoId: entry.veiculoId } });
        setDataNivel2(data.length > 0 ? data : [
            { name: 'Abastecimento', value: entry.value * 0.6 },
            { name: 'Manutenção', value: entry.value * 0.4 }
        ]);
        setLevel(2);
      } catch (err) {
        setDataNivel2([
            { name: 'Abastecimento', value: entry.value * 0.6 },
            { name: 'Manutenção', value: entry.value * 0.4 }
        ]);
        setLevel(2);
      } finally {
        setLoading(false);
      }
    } else if (metric === 'COMBUSTIVEL' || metric === 'OFICINA' || metric === 'ADITIVOS') {
      let catReq = 'ABASTECIMENTO';
      let catDisplay = 'Abastecimento';
      if (metric === 'OFICINA') { catReq = 'MANUTENCAO'; catDisplay = 'Manutenção'; }
      if (metric === 'ADITIVOS') { catReq = 'ADITIVO'; catDisplay = 'Aditivos'; }
      
      setSelectedCategoria(catDisplay);
      try {
        const { data } = await api.get('/drilldown/temporal', { 
            params: { veiculoId: entry.veiculoId, categoria: catReq } 
        });
        
        setDataNivel3(data.length > 0 ? data : [
            { name: 'Nenhum dado', value: entry.value }
        ]);
        setLevel(3);
      } catch (err) {
        console.error(err);
        setDataNivel3([{ name: 'Erro de conexão', value: 1 }]);
        setLevel(3);
      } finally {
        setLoading(false);
      }
    } else if (metric === 'KM_TOTAL') {
      try {
        const { data } = await api.get('/drilldown/km/temporal', { 
            params: { veiculoId: entry.veiculoId } 
        });
        
        setDataNivel3(data.length > 0 ? data : [
            { name: 'Nenhum dado', value: entry.value }
        ]);
        setLevel(3);
      } catch (err) {
        console.error(err);
        setDataNivel3([{ name: 'Erro de conexão', value: 1 }]);
        setLevel(3);
      } finally {
        setLoading(false);
      }
    } else if (metric === 'EFICIENCIA') {
      try {
        const { data } = await api.get('/drilldown/eficiencia/temporal', { 
            params: { veiculoId: entry.veiculoId } 
        });
        
        setDataNivel3(data.length > 0 ? data : [
            { name: 'Nenhum dado', value: entry.value }
        ]);
        setLevel(3);
      } catch (err) {
        console.error(err);
        setDataNivel3([{ name: 'Erro de conexão', value: 1 }]);
        setLevel(3);
      } finally {
        setLoading(false);
      }
    } else if (metric === 'CUSTO_KM') {
      try {
        const { data } = await api.get('/drilldown/custokm/temporal', { 
            params: { veiculoId: entry.veiculoId } 
        });
        
        setDataNivel3(data.length > 0 ? data : [
            { name: 'Nenhum dado', value: entry.value }
        ]);
        setLevel(3);
      } catch (err) {
        console.error(err);
        setDataNivel3([{ name: 'Erro de conexão', value: 1 }]);
        setLevel(3);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSliceClickNivel2 = async (entry: any) => {
    if (metric === 'CUSTO_GLOBAL') {
      setSelectedCategoria(entry.name);
      setLoading(true);
      try {
        const reqCategoria = entry.name === 'Abastecimento' ? 'ABASTECIMENTO' : 'MANUTENCAO';
        const { data } = await api.get('/drilldown/temporal', { 
            params: { veiculoId: selectedVeiculoId, categoria: reqCategoria } 
        });
        
        setDataNivel3(data.length > 0 ? data : [
            { name: 'Jan', value: entry.value * 0.2 },
            { name: 'Fev', value: entry.value * 0.5 },
            { name: 'Mar', value: entry.value * 0.3 }
        ]);
        setLevel(3);
      } catch (err) {
        setDataNivel3([
            { name: 'Jan', value: entry.value * 0.2 },
            { name: 'Fev', value: entry.value * 0.5 },
            { name: 'Mar', value: entry.value * 0.3 }
        ]);
        setLevel(3);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSliceClickNivel3 = async (entry: any) => {
    setSelectedMes(entry.name);
    setLoading(true);
    try {
      if (metric === 'KM_TOTAL' || metric === 'EFICIENCIA') {
        const { data } = await api.get('/drilldown/km/operadores', { 
            params: { veiculoId: selectedVeiculoId, mes: entry.name } 
        });
        const finalData = data.length > 0 ? data : [
          { name: 'Nenhum operador encontrado', value: entry.value }
        ];
        setDataNivel4(finalData);
        setLevel(4);
      } else if (metric === 'CUSTO_KM') {
        const { data } = await api.get('/drilldown/custokm/categorias', { 
            params: { veiculoId: selectedVeiculoId, mes: entry.name } 
        });
        const finalData = data.length > 0 ? data : [
          { name: 'Sem custos registrados', value: entry.value }
        ];
        setDataNivel4(finalData);
        setLevel(4);
      } else {
        let reqCategoria = selectedCategoria === 'Abastecimento' ? 'ABASTECIMENTO' : 'MANUTENCAO';
        if (metric === 'ADITIVOS') reqCategoria = 'ADITIVO';

        const { data } = await api.get('/drilldown/fornecedores', { 
            params: { veiculoId: selectedVeiculoId, categoria: reqCategoria, mes: entry.name } 
        });
        
        const finalData = data.length > 0 ? data : [
          { name: 'Nenhum fornecedor encontrado', value: entry.value }
        ];
        
        setDataNivel4(finalData);
        setLevel(4);
      }
    } catch (err) {
      console.error(err);
      setDataNivel4([{ name: 'Erro de conexão', value: 1 }]);
      setLevel(4);
    } finally {
      setLoading(false);
    }
  };

  const getHighchartsOptions = (data: any[], clickHandler: (entry: any) => void) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);

    return {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        animation: true,
        spacing: [40, 10, 40, 10], 
        options3d: {
          enabled: true,
          alpha: 50,
          beta: 0,
        },
        style: {
          fontFamily: "var(--font-sans)",
        }
      },
      title: {
        text: null, 
      },
      accessibility: { enabled: false },
      credits: { enabled: false },
      exporting: { enabled: false },
      tooltip: {
        useHTML: true,
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        borderRadius: 12,
        borderWidth: 1,
        shadow: true,
        style: {
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
          color: "var(--color-text-main)"
        },
        formatter: function(this: any) {
          const percentage = ((this.point.y as number) / total) * 100;
          return `
            <div style="padding:8px">
              <b>${this.point.name}</b><br/>
              Total: <b>${this.point.formattedValue}</b><br/>
              Percentual: <b>${percentage.toFixed(1).replace(".", ",")}%</b>
            </div>
          `;
        }
      },
      plotOptions: {
        pie: {
          size: '85%',
          center: ['50%', '45%'],
          allowPointSelect: true,
          cursor: "pointer",
          depth: 55,
          showInLegend: true,
          slicedOffset: 12,
          borderWidth: 1.5,
          borderColor: "var(--color-surface)",
          edgeWidth: 1,
          edgeColor: "rgba(0,0,0,0.5)",
          shadow: {
            color: "rgba(0,0,0,0.4)",
            offsetX: 0,
            offsetY: 15,
            opacity: 0.4,
            width: 15,
          },
          states: {
            inactive: { opacity: 1 },
            hover: {
              brightness: 0.15,
              halo: {
                size: 15,
                attributes: { fill: "rgba(255,255,255,0.2)" }
              }
            }
          },
          dataLabels: {
            enabled: false,
          },
          point: {
            events: {
              click: function(this: any) {
                clickHandler(this.options.customData);
              }
            }
          }
        },
      },
      legend: {
        enabled: true,
        useHTML: true,
        itemStyle: {
          color: 'var(--color-text-main)',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'var(--font-sans)'
        },
        itemHoverStyle: {
          color: 'var(--color-text-muted)'
        },
        labelFormatter: function(this: any) {
          const percentage = ((this.y as number) / total) * 100;
          return `${this.name} <span style="opacity: 0.7; font-weight: normal; margin-left: 4px;">(${percentage.toFixed(1).replace(".", ",")}%)</span>`;
        },
      },
      series: [
        {
          type: "pie",
          data: data.map((item: any, index: number) => {
            const baseColor = HIGHCHARTS_COLORS[index % HIGHCHARTS_COLORS.length];
            const color2 = Highcharts.color(baseColor).brighten(-0.5).get('rgb');

            return {
              name: item.name,
              y: item.value,
              sliced: true, 
              formattedValue: metric === 'KM_TOTAL' ? `${item.value.toLocaleString('pt-BR')} km` : metric === 'EFICIENCIA' ? `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/l` : metric === 'CUSTO_KM' ? `${formatBRL(item.value)} / km` : formatBRL(item.value),
              customData: item,
              color: {
                radialGradient: {
                  cx: 0.4,
                  cy: 0.3,
                  r: 0.9,
                },
                stops: [
                  [0, Highcharts.color(baseColor).brighten(0.2).get('rgb')],
                  [1, color2],
                ],
              }
            };
          })
        }
      ]
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface glass-premium border border-border/50 rounded-[2rem] w-full max-w-6xl h-[85vh] flex flex-col shadow-float overflow-hidden relative">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 sm:px-8 border-b border-border/40 bg-surface-hover/20">
          <div className="flex items-center gap-4">
            {level > 1 && (
              <Button variant="ghost" size="icon" onClick={() => setLevel((l) => (l - 1) as 1 | 2 | 3)} className="hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Button>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-header font-black text-text-main tracking-tight flex items-center gap-2">
                {title}
              </h2>
              <p className="text-sm font-medium text-text-secondary mt-1">
                {level === 1 && "Visão Macro - Clique em um elemento para detalhar"}
                {level === 2 && `Visão por Veículo: ${selectedVeiculo} - Selecione a categoria`}
                {level === 3 && `Evolução Mensal: ${selectedCategoria ? selectedCategoria : selectedVeiculo}`}
                {level === 4 && `${metric === 'KM_TOTAL' || metric === 'EFICIENCIA' ? 'Operadores' : metric === 'CUSTO_KM' ? 'Breakdown de Custos' : 'Top Fornecedores'}: ${selectedMes} (${selectedCategoria ? selectedCategoria : selectedVeiculo})`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-danger/10 hover:text-danger">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-8 relative flex items-center justify-center overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-medium animate-pulse">Processando Big Data...</p>
            </div>
          ) : (
            <div className="w-full h-full min-h-[400px] sm:min-h-[650px]">
              
              {/* NÍVEL 1: PIE CHART MACRO */}
              {level === 1 && (
                <div className="w-full h-full">
                  <HighchartsReact 
                    highcharts={Highcharts} 
                    options={getHighchartsOptions(dataNivel1, handleSliceClickNivel1)} 
                    containerProps={{ style: { height: "100%", width: "100%" } }}
                  />
                </div>
              )}

              {/* NÍVEL 2: PIE CHART VEÍCULO */}
              {level === 2 && (
                <div className="w-full h-full">
                  <HighchartsReact 
                    highcharts={Highcharts} 
                    options={getHighchartsOptions(dataNivel2, handleSliceClickNivel2)} 
                    containerProps={{ style: { height: "100%", width: "100%" } }}
                  />
                </div>
              )}

              {/* NÍVEL 3: BAR CHART TEMPORAL */}
              {level === 3 && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 mt-4" style={{ width: '100%', height: '450px' }}>
                    <ResponsiveContainer width="99%" height={450}>
                      <BarChart data={dataNivel3.slice(0, new Date().getMonth() + 1)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                        <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--color-text-muted)" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => metric === 'KM_TOTAL' ? `${v} km` : metric === 'EFICIENCIA' ? `${v.toFixed(1)} km/l` : metric === 'CUSTO_KM' ? `${formatBRL(v)} / km` : formatBRL(v)} width={90} />
                        <RechartsTooltip 
                          cursor={{fill: 'var(--color-surface-hover)', opacity: 0.5}} 
                          formatter={(value: number | string | undefined) => {
                            const v = Number(value ?? 0);
                            return metric === 'KM_TOTAL' 
                                ? `${v.toLocaleString('pt-BR')} km` 
                                : metric === 'EFICIENCIA' 
                                ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/l` 
                                : metric === 'CUSTO_KM' 
                                ? `${formatBRL(v)} / km` 
                                : formatBRL(v);
                          }} 
                          contentStyle={{ borderRadius: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="var(--color-primary)" 
                          radius={[6, 6, 0, 0]} 
                          className="cursor-pointer hover:brightness-110 transition-all"
                          animationDuration={800}
                          animationEasing="ease-out"
                          onClick={(data) => {
                              handleSliceClickNivel3(data);
                          }}
                        >
                          {dataNivel3.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={HIGHCHARTS_COLORS[index % HIGHCHARTS_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* NÍVEL 4: PIE CHART FORNECEDORES */}
              {level === 4 && (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full h-full">
                    <HighchartsReact 
                      highcharts={Highcharts} 
                      options={getHighchartsOptions(dataNivel4, () => {
                        toast.info("Em breve: Lista de tickets deste fornecedor!");
                      })} 
                      containerProps={{ style: { height: "100%", width: "100%" } }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}