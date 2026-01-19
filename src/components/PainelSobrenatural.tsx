import { useMemo } from 'react';
import type { Jornada } from '../types';
import { isJornadaFantasma, getNomeFantasma } from '../utils';

interface PainelSobrenaturalProps {
    jornadas: Jornada[];
}

export function PainelSobrenatural({ jornadas }: PainelSobrenaturalProps) {

    const stats = useMemo(() => {
        // Filtra apenas as jornadas onde os fantasmas agiram
        const jornadasFantasmas = jornadas.filter(isJornadaFantasma);

        const totalKmAssombrado = jornadasFantasmas.reduce((acc, j) => {
            const km = (j.kmFim || 0) - j.kmInicio;
            return acc + (km > 0 ? km : 0);
        }, 0);

        // Agrupa por "Invocador" (O Motorista original da jornada)
        const rankingInvocadores = jornadasFantasmas.reduce((acc, j) => {
            // [CORREÇÃO] Fallback temático caso o operador tenha sido deletado
            const nome = j.operador?.nome || 'Invocador Oculto';

            if (!acc[nome]) acc[nome] = { count: 0, km: 0 };
            acc[nome].count += 1;
            acc[nome].km += ((j.kmFim || 0) - j.kmInicio);
            return acc;
        }, {} as Record<string, { count: number, km: number }>);

        // Top 3 Invocadores
        const topInvocadores = Object.entries(rankingInvocadores)
            .map(([nome, dados]) => ({ nome, ...dados }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return {
            totalOcorrencias: jornadasFantasmas.length,
            totalKm: totalKmAssombrado,
            topInvocadores,
            ultimoFantasma: jornadasFantasmas.length > 0 ? jornadasFantasmas[0] : null
        };
    }, [jornadas]);

    // Se não houver fantasmas, o painel nem aparece (para não poluir)
    if (stats.totalOcorrencias === 0) return null;

    return (
        // [DESIGN EXCEPCIONAL] Mantido tema escuro para destacar a gamificação
        <div className="mt-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-2xl border border-purple-500/30 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">

            {/* Efeitos de Fundo */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-[80px] opacity-40 animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-[80px] opacity-40"></div>

            <div className="relative z-10">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl filter drop-shadow-lg animate-bounce">👻</div>
                        <div>
                            <h2 className="text-2xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white">
                                ATIVIDADE PARANORMAL
                            </h2>
                            <p className="text-xs text-purple-300 uppercase tracking-widest font-semibold mt-1">
                                Relatório de Inconsistências & Esquecimentos
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 text-right min-w-[140px]">
                        <p className="text-3xl font-bold text-white font-mono leading-none">
                            {stats.totalKm.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[10px] text-purple-300 uppercase mt-1">KM Rodados por Entidades</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Coluna 1: Ranking dos Invocadores */}
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
                        <h3 className="text-xs font-bold text-purple-200 mb-4 uppercase flex items-center gap-2 tracking-wider">
                            🔮 Ranking de Invocadores (Quem esqueceu aberto)
                        </h3>
                        <div className="space-y-3">
                            {stats.topInvocadores.map((invocador, index) => (
                                <div key={invocador.nome} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-900/40 to-transparent border border-purple-500/10 hover:border-purple-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg
                                            ${index === 0 ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-400/50' :
                                                index === 1 ? 'bg-gray-300 text-gray-800' :
                                                    'bg-orange-700 text-orange-100'}
                                        `}>
                                            {index + 1}º
                                        </div>
                                        <span className="font-medium text-purple-50">{invocador.nome}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-bold text-white">{invocador.count} <span className="text-[10px] font-normal text-purple-300">ocorrências</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coluna 2: Última Aparição */}
                    <div className="bg-gradient-to-br from-purple-950/40 to-indigo-950/40 rounded-xl p-5 border border-white/5 flex flex-col justify-center relative">
                        <div className="absolute top-2 right-2 text-purple-500/20 text-6xl font-serif select-none">“</div>
                        <h3 className="text-xs font-bold text-purple-200 mb-2 uppercase tracking-wider">Última Aparição</h3>
                        {stats.ultimoFantasma && (
                            <div className="mt-1 relative">
                                <p className="text-xl font-medium text-white italic leading-relaxed font-serif">
                                    "{getNomeFantasma(stats.ultimoFantasma.observacoes)}"
                                </p>
                                <div className="mt-4 flex items-center gap-3 text-sm text-purple-200">
                                    <span className="bg-purple-500/20 px-2 py-1 rounded text-xs font-mono border border-purple-500/30">
                                        {/* [CORREÇÃO] Fallback seguro para o veículo */}
                                        {stats.ultimoFantasma.veiculo?.placa || 'Carruagem Fantasma'}
                                    </span>
                                    <span>
                                        foi assumido em {new Date(stats.ultimoFantasma.dataInicio).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-200">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Gap preenchido automaticamente pelo sistema
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}