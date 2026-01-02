import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DadosEvolucaoKm } from '../types';

// [PADRONIZAÇÃO] Cor exata para o gráfico (já que o Recharts pede HEX)
// Ajustei para um tom petróleo para combinar com o 'text-primary' do seu tema
const PRIMARY_COLOR = '#0f766e'; // (Teal 700)

interface GraficoKmVeiculoProps {
    dados: DadosEvolucaoKm[];
}

export function GraficoKmVeiculo({ dados }: GraficoKmVeiculoProps) {
    if (dados.length === 0) {
        return (
            // [PADRONIZAÇÃO] bg-gray-50 -> bg-background, border-gray-100 -> border-border
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-background">
                <p className="text-gray-400 text-sm font-medium">Sem dados de rodagem para o período.</p>
            </div>
        );
    }

    return (
        // [PADRONIZAÇÃO] border-gray-100 -> border-border
        <div className="h-72 w-full bg-white p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Evolução do Odômetro</h4>

                {/* [PADRONIZAÇÃO] Cores ajustadas para o tema Primary */}
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md font-bold uppercase">
                    Últimos 7 dias
                </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="data"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        dy={10}
                    />
                    <YAxis
                        hide
                        domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb', // border-border color aproximada
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}
                        cursor={{ stroke: PRIMARY_COLOR, strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="km"
                        stroke={PRIMARY_COLOR}
                        strokeWidth={3}
                        dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: PRIMARY_COLOR }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}