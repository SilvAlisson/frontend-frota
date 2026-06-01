import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DadosEvolucaoKm } from '../types';
import { Activity } from 'lucide-react';

// CORREÇÃO 1: Usando variáveis CSS do tema para suportar Modo Claro e Escuro corretamente
const PRIMARY_COLOR = 'var(--color-primary)';
const SURFACE_COLOR = 'var(--color-surface)';

interface GraficoKmVeiculoProps {
    dados: DadosEvolucaoKm[];
}

// TOOLTIP CUSTOMIZADA
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/80 backdrop-blur-md border border-border/60 p-4 rounded-2xl shadow-float animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-primary" /> {label}
                </p>
                <p className="text-2xl font-black text-text-main font-mono tracking-tighter leading-none">
                    {payload[0].value.toLocaleString('pt-BR')} 
                    <span className="text-sm font-bold text-text-secondary ml-1 tracking-normal">km</span>
                </p>
            </div>
        );
    }
    return null;
};

export function GraficoKmVeiculo({ dados }: GraficoKmVeiculoProps) {
    if (dados.length === 0) {
        return (
            <div className="h-[320px] w-full flex flex-col items-center justify-center border border-dashed border-border/60 rounded-[2rem] bg-surface/30">
                <div className="w-12 h-12 bg-surface-hover rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-text-muted/50" />
                </div>
                <p className="text-text-secondary text-sm font-bold tracking-tight">Sem dados de rodagem para o período.</p>
            </div>
        );
    }

    return (
        <div className="h-[340px] w-full bg-surface p-6 sm:p-8 rounded-[2rem] shadow-sm border border-border/60 flex flex-col relative overflow-hidden group">
            
            {/* Header do Gráfico */}
            <div className="flex items-start justify-between mb-8 shrink-0 relative z-10">
                <div>
                    <h4 className="text-lg font-black text-text-main tracking-tight">Evolução de Hodômetro</h4>
                    <p className="text-xs font-medium text-text-secondary mt-0.5">Leituras registradas nas jornadas diárias</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm">
                    Últimos 7 dias
                </span>
            </div>

            {/* Container do Gráfico */}
            <div className="flex-1 w-full min-h-[240px] relative z-10 -ml-4 sm:-ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    
                    {/* CORREÇÃO 2: Aumentamos a margem bottom para 25 para evitar o corte do texto */}
                    <AreaChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                        
                        <defs>
                            <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        {/* CORREÇÃO 3: Grade ajustada para pegar a cor da borda do tema atual */}
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                        
                        <XAxis
                            dataKey="data"
                            axisLine={false}
                            tickLine={false}
                            /* CORREÇÃO 4: Cor do texto fixa na variável mutável do tema */
                            tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 600 }}
                            dy={15}
                            /* CORREÇÃO 5: Altura do eixo X definida para acomodar o texto + o distanciamento */
                            height={40}
                        />
                        
                        <YAxis hide domain={['dataMin - 15', 'dataMax + 15']} />
                        
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: PRIMARY_COLOR, strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.4 }}
                        />
                        
                        <Area
                            type="monotone"
                            dataKey="km"
                            stroke={PRIMARY_COLOR}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorKm)"
                            /* CORREÇÃO 6: O contorno (stroke) do hover agora usa a cor de fundo (SURFACE_COLOR) em vez do branco fixo */
                            activeDot={{ r: 6, strokeWidth: 4, stroke: SURFACE_COLOR, fill: PRIMARY_COLOR, className: "shadow-lg" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            {/* Brilho de fundo decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>
        </div>
    );
}