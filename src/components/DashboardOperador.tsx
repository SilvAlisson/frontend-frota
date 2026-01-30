import { useState } from 'react';
import { Fuel, Truck, History, FileText, Info } from 'lucide-react';
import { IniciarJornada } from './IniciarJornada';
import { JornadaCard } from './JornadaCard';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { HistoricoJornadas } from './HistoricoJornadas';
import { GestaoDocumentos } from './GestaoDocumentos';
// CORREÇÃO: Imports da pasta UI correta
import { PageHeader } from './ui/PageHeader';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import type { User, Veiculo, Jornada, Produto, Fornecedor } from '../types';

interface DashboardOperadorProps {
    user: User;
    usuarios: User[];
    veiculos: Veiculo[];
    produtos: Produto[];
    fornecedores: Fornecedor[];
    jornadasAtivas: Jornada[];
    onJornadaIniciada: (jornada: Jornada) => void;
    onJornadaFinalizada: (id: string) => void;
}

export function DashboardOperador({
    user,
    usuarios,
    veiculos,
    produtos,
    fornecedores,
    jornadasAtivas,
    onJornadaIniciada,
    onJornadaFinalizada
}: DashboardOperadorProps) {
    const [modalAbastecimentoOpen, setModalAbastecimentoOpen] = useState(false);
    const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
    const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);

    // Filtra jornadas para encontrar a do operador logado
    const minhasJornadas = jornadasAtivas.filter(j => j.operador?.id === user.id);
    const tenhoJornadaAtiva = minhasJornadas.length > 0;
    const veiculoEmUsoId = tenhoJornadaAtiva ? minhasJornadas[0].veiculo?.id : undefined;

    return (
        <div className="space-y-8 animate-enter pb-20">
            
            <PageHeader 
                title={`Olá, ${user.nome.split(' ')[0]}!`}
                subtitle={tenhoJornadaAtiva ? "Você tem uma jornada em andamento." : "Selecione uma ação para começar."}
            />

            {/* --- ÁREA DE AÇÃO PRINCIPAL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* BLOCO 1: OPERAÇÃO ATUAL (Ocupa 2 colunas) */}
                <div className="lg:col-span-2 space-y-6">
                    {!tenhoJornadaAtiva ? (
                        <Card className="border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary text-white rounded-xl shadow-button">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main">Iniciar Nova Jornada</h3>
                                    <p className="text-sm text-text-secondary">Escolha o veículo que você vai conduzir hoje.</p>
                                </div>
                            </div>
                            <IniciarJornada
                                usuarios={usuarios}
                                veiculos={veiculos}
                                operadorLogadoId={user.id}
                                onJornadaIniciada={onJornadaIniciada}
                                jornadasAtivas={jornadasAtivas}
                            />
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-success uppercase tracking-widest bg-success/10 py-2 px-4 rounded-full w-fit border border-success/20">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                                </span>
                                Veículo em Operação
                            </div>

                            {minhasJornadas.map((jornada) => (
                                <JornadaCard
                                    key={jornada.id}
                                    jornada={jornada}
                                    onJornadaFinalizada={() => onJornadaFinalizada(jornada.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* BLOCO 2: MENU RÁPIDO (Lateral) */}
                <div className="space-y-4">
                    <button
                        onClick={() => setModalAbastecimentoOpen(true)}
                        className="w-full flex items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-card hover:shadow-float hover:border-warning-500 hover:bg-warning-500/5 transition-all group text-left"
                    >
                        <div className="p-3 bg-warning-500/10 text-warning-600 rounded-lg group-hover:bg-warning-500 group-hover:text-white transition-colors">
                            <Fuel className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block font-bold text-text-main">Registrar Abastecimento</span>
                            <span className="text-xs text-text-secondary">Lançar diesel, gasolina ou arla</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setModalDocumentosOpen(true)}
                        className="w-full flex items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-card hover:shadow-float hover:border-sky-500 hover:bg-sky-500/5 transition-all group text-left"
                    >
                        <div className="p-3 bg-sky-500/10 text-sky-600 rounded-lg group-hover:bg-sky-500 group-hover:text-white transition-colors">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block font-bold text-text-main">Meus Documentos</span>
                            <span className="text-xs text-text-secondary">CNH e documentos do veículo</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setModalHistoricoOpen(true)}
                        className="w-full flex items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-card hover:shadow-float hover:border-purple-500 hover:bg-purple-500/5 transition-all group text-left"
                    >
                        <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block font-bold text-text-main">Meu Histórico</span>
                            <span className="text-xs text-text-secondary">Ver minhas viagens anteriores</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* --- MODAIS --- */}
            
            <Modal
                isOpen={modalAbastecimentoOpen}
                onClose={() => setModalAbastecimentoOpen(false)}
                title="Novo Abastecimento"
                className="max-w-2xl"
            >
                <FormRegistrarAbastecimento
                    usuarios={usuarios}
                    veiculos={veiculos}
                    produtos={produtos}
                    fornecedores={fornecedores}
                    usuarioLogado={user}
                    veiculoPreSelecionadoId={veiculoEmUsoId}
                    onCancelar={() => setModalAbastecimentoOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={modalHistoricoOpen}
                onClose={() => setModalHistoricoOpen(false)}
                title="Meu Histórico de Viagens"
                className="max-w-5xl"
            >
                <HistoricoJornadas
                    veiculos={veiculos}
                    userRole={user.role} 
                />
            </Modal>

            <Modal
                isOpen={modalDocumentosOpen}
                onClose={() => setModalDocumentosOpen(false)}
                title="Documentos do Veículo"
                className="max-w-4xl"
            >
                {veiculoEmUsoId ? (
                    <GestaoDocumentos veiculoId={veiculoEmUsoId} somenteLeitura={true} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="bg-background p-4 rounded-full mb-3">
                            <Info className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-bold text-text-main">Nenhum veículo selecionado</h3>
                        <p className="text-text-secondary max-w-xs mt-1">Inicie uma jornada para ver os documentos do veículo.</p>
                    </div>
                )}
            </Modal>

        </div>
    );
}