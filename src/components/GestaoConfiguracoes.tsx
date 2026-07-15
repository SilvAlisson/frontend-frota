import React, { useState } from 'react';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { motion } from 'framer-motion';
import { Settings, Save, AlertTriangle, ShieldAlert, Clock, AlertCircle } from 'lucide-react';

export function GestaoConfiguracoes() {
    const { config, isLoading, error, updateConfig } = useConfiguracoes();
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [diasAlerta, setDiasAlerta] = useState<number | ''>('');
    const [kmAlerta, setKmAlerta] = useState<number | ''>('');
    const [bloqueio, setBloqueio] = useState(false);

    // Inicializa estados
    React.useEffect(() => {
        if (config) {
            setDiasAlerta(config.diasAntecedenciaAlerta);
            setKmAlerta(config.kmAntecedenciaAlerta);
            setBloqueio(config.bloqueioOperacionalAtivo);
        }
    }, [config]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');
        
        try {
            await updateConfig({
                diasAntecedenciaAlerta: diasAlerta === '' ? 15 : Number(diasAlerta),
                kmAntecedenciaAlerta: kmAlerta === '' ? 1000 : Number(kmAlerta),
                bloqueioOperacionalAtivo: bloqueio
            });
            setSuccessMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6 max-w-4xl mx-auto">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/3"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                        <h3 className="text-red-500 font-bold text-lg">Erro ao carregar configurações</h3>
                        <p className="text-red-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8"
        >
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <Settings className="h-8 w-8 text-indigo-500" />
                        Configurações Globais
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Gerencie as regras de negócio, limites e comportamentos automáticos do sistema.
                    </p>
                </div>
            </header>

            {successMessage && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 font-medium"
                >
                    <Save className="h-5 w-5" />
                    {successMessage}
                </motion.div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                
                {/* CARD 1: Alertas e Vencimentos */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/50 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Clock className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                <Clock className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Motor de Alertas</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Antecedência para Vencimentos (Dias)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={diasAlerta}
                                        onChange={(e) => setDiasAlerta(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Ex: 15"
                                    />
                                    <div className="absolute right-4 top-3.5 text-gray-400 font-medium">dias</div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    Define com quantos dias de antecedência o sistema deve alertar sobre vencimentos de CNH, ASO e Manutenções.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Antecedência para Manutenções (KM)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="100"
                                        step="100"
                                        required
                                        value={kmAlerta}
                                        onChange={(e) => setKmAlerta(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Ex: 1000"
                                    />
                                    <div className="absolute right-4 top-3.5 text-gray-400 font-medium">km</div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    Define com quantos quilômetros de antecedência o plano de manutenção preventiva será acionado.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 2: Regras Operacionais */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/50 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldAlert className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                                <ShieldAlert className="h-5 w-5 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bloqueios de Segurança</h2>
                        </div>

                        <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                            <div className="relative flex items-center mt-1">
                                <input
                                    type="checkbox"
                                    checked={bloqueio}
                                    onChange={(e) => setBloqueio(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${bloqueio ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${bloqueio ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white text-lg">Bloqueio Operacional Rígido</div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Quando ativado, impede a abertura de jornadas em veículos com restrições críticas (documento vencido, manutenção obrigatória atrasada) ou operadores com CNH/ASO vencidos. 
                                    <span className="block mt-2 font-medium text-amber-600 dark:text-amber-500">
                                        Recomendado manter ativado para garantir conformidade legal.
                                    </span>
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        {isSaving ? (
                            <>
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                <span>Salvar Configurações</span>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </motion.div>
    );
}
