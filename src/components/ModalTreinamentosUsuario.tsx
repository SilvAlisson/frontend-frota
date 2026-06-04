import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTreinamentosUsuario, treinamentoSchema, type TreinamentoForm } from '../hooks/useTreinamentosUsuario';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import {
    X, Trash2, ExternalLink, Calendar, AlertTriangle, Loader2,
    CheckCircle2, FileSpreadsheet, Plus, GraduationCap
} from 'lucide-react';
import type { User } from '../types';
import { useModalStore } from '../hooks/useModalStore';

import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { hapticError } from '../lib/haptics';

interface ModalProps {
    usuario: User;
    onClose: () => void;
}

export function ModalTreinamentosUsuario({ usuario, onClose }: ModalProps) {
    const { treinamentos, loading, addTreinamento, removeTreinamento, importarPlanilha } = useTreinamentosUsuario(usuario.id);
    const { openModal, closeModal } = useModalStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<TreinamentoForm>({
        resolver: zodResolver(treinamentoSchema),
        defaultValues: {
            nome: '',
            dataRealizacao: new Date().toISOString().split('T')[0],
            dataVencimento: '',
            descricao: '',
            comprovanteUrl: ''
        }
    });

    const onSubmit = async (data: TreinamentoForm) => {
        await addTreinamento(data);
        reset();
    };

    const confirmExclusao = (id: string, nome: string) => {
        const modalId = openModal('CONFIRM', {
            title: "Excluir Certificação",
            description: `Tem certeza que deseja remover o Registro de "${nome}" do histórico deste colaborador?`,
            variant: "danger",
            confirmLabel: "Sim, Remover",
            onConfirm: async () => {
                setDeletingId(id);
                try {
                    await removeTreinamento(id);
                } finally {
                    setDeletingId(null);
                    closeModal(modalId);
                }
            }
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await importarPlanilha(file);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const getStatusInfo = (vencimento: string | null | undefined) => {
        if (!vencimento) return { color: 'bg-info/10 text-info border-info/20', icon: CheckCircle2, text: 'Vitalício' };

        const hoje = new Date();
        const dataVenc = new Date(vencimento);
        const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias < 0) return { color: 'bg-error/10 text-error border-error/20', icon: AlertTriangle, text: 'Vencido' };
        if (diffDias < 30) return { color: 'bg-warning-500/10 text-warning-600 border-warning-500/20', icon: AlertTriangle, text: 'Expira Brevemente' };
        return { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2, text: 'Válido' };
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-background rounded-[2.5rem] shadow-float border border-border/60 w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
                onClick={e => e.stopPropagation()}
            >
                {/* ESQUERDA: FORMULÁRIO */}
                <div className="w-full md:w-[420px] bg-surface p-5 sm:p-8 border-r border-border/60 overflow-y-auto flex flex-col scrollbar-thin">
                    
                    {/* Perfil do Colaborador */}
                    <div className="mb-8 flex items-center gap-4 pb-6 border-b border-border/60">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 shadow-inner shrink-0">
                            {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-lg font-black text-text-main leading-tight truncate">{usuario.nome}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-surface-hover px-2 py-0.5 rounded-md border border-border/60 w-fit mt-1.5">{usuario.role}</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" /> Novo Registro
                        </h4>

                        <form onSubmit={handleSubmit(onSubmit, () => hapticError())} className="space-y-5">
                            <Input
                                label="Nome da Certificação"
                                placeholder="Ex: Direção Defensiva"
                                {...register('nome')}
                                error={errors.nome?.message}
                                disabled={isSubmitting}
                                className="bg-background"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Data de Emissão"
                                    type="date"
                                    {...register('dataRealizacao')}
                                    error={errors.dataRealizacao?.message}
                                    disabled={isSubmitting}
                                    className="bg-background"
                                />
                                <Input
                                    label="Data de Validade"
                                    type="date"
                                    {...register('dataVencimento')}
                                    disabled={isSubmitting}
                                    className="bg-background"
                                />
                            </div>

                            <Input
                                label="Link do Certificado (URL)"
                                placeholder="https://..."
                                {...register('comprovanteUrl')}
                                error={errors.comprovanteUrl?.message}
                                disabled={isSubmitting}
                                className="bg-background"
                            />

                            <Textarea
                                label="Observações Adicionais"
                                {...register('descricao')}
                                disabled={isSubmitting}
                                rows={3}
                                placeholder="Carga horária, entidade formadora..."
                                autoResize={false}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full shadow-button hover:shadow-float-primary mt-4 h-12 text-sm uppercase tracking-widest"
                                isLoading={isSubmitting}
                            >
                                Inserir Certificação
                            </Button>
                        </form>
                    </div>

                    {/* Importação Excel */}
                    <div className="mt-8 pt-6 border-t border-border/60">
                        <p className="text-[9px] text-center text-text-muted font-black mb-3 uppercase tracking-[0.2em]">
                            Importação em Massa
                        </p>
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed border-border/60 text-text-secondary hover:border-primary/50 hover:text-primary transition-all bg-background h-12"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            icon={<FileSpreadsheet className="w-4 h-4" />}
                        >
                            Upload de Planilha Excel
                        </Button>
                    </div>
                </div>

                {/* DIREITA: LISTAGEM */}
                <div className="flex-1 bg-background flex flex-col h-full overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-border/60 flex justify-between items-center bg-surface sticky top-0 z-10 shrink-0">
                        <div>
                            <h3 className="text-2xl font-black text-text-main tracking-tight">Registro de Formação</h3>
                            <p className="text-sm font-medium text-text-secondary mt-1 opacity-90">Monitorize a validade técnica e conformidade deste colaborador.</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full hover:bg-surface-hover text-text-muted hover:text-error transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-background scrollbar-thin">
                        {loading ? (
                            <div className="grid gap-4 auto-rows-max">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-32 w-full rounded-2xl border border-border/40" />
                                ))}
                            </div>
                        ) : treinamentos.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <EmptyState 
                                    icon={GraduationCap} 
                                    title="Sem Formação Registrada" 
                                    description="Este colaborador ainda não possui histórico de cursos ou reciclagens no sistema." 
                                />
                            </div>
                        ) : (
                            <div className="grid gap-4 auto-rows-max">
                                {treinamentos.map(treino => {
                                    const status = getStatusInfo(treino.dataVencimento);
                                    const StatusIcon = status.icon;

                                    return (
                                        <div key={treino.id} className="group bg-surface border border-border/60 rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.color.split(' ')[0]}`}></div>
                                            
                                            <div className="flex-1 pl-2 min-w-0">
                                                <h4 className="font-black text-text-main text-lg tracking-tight truncate" title={treino.nome}>{treino.nome}</h4>
                                                
                                                <div className="flex flex-wrap gap-x-3 gap-y-2 mt-2">
                                                    <span className="flex items-center gap-1.5 bg-surface-hover px-2.5 py-1 rounded-md text-[10px] text-text-secondary font-bold uppercase tracking-widest border border-border/60">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(treino.dataRealizacao)}
                                                    </span>
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${status.color}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {status.text}
                                                    </span>
                                                </div>
                                                
                                                {treino.descricao && (
                                                    <p className="text-xs text-text-secondary mt-3 font-medium line-clamp-2">"{treino.descricao}"</p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pl-2 w-full sm:w-auto justify-end sm:justify-start border-t border-dashed border-border/60 sm:border-none pt-3 sm:pt-0">
                                                {treino.comprovanteUrl && (
                                                    <a
                                                        href={treino.comprovanteUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 shadow-sm bg-surface-hover"
                                                        title="Visualizar Certificado"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => confirmExclusao(treino.id, treino.nome)}
                                                    disabled={deletingId === treino.id}
                                                    className="w-10 h-10 bg-surface-hover text-text-muted hover:text-error hover:bg-error/10 border-transparent shadow-sm"
                                                    title="Excluir Registro"
                                                    icon={deletingId === treino.id ? <Loader2 className="animate-spin h-4 w-4 text-error" /> : <Trash2 className="w-4 h-4" />}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
