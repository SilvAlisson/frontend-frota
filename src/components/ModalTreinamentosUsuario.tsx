import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ExcelJS from 'exceljs';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import {
    X, Trash2, ExternalLink, Calendar, AlertTriangle, Loader2,
    CheckCircle2, FileSpreadsheet, Plus, GraduationCap
} from 'lucide-react';
import type { TreinamentoRealizado, User } from '../types';

// ✨ Novos Componentes Elite
import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';

interface ModalProps {
    usuario: User;
    onClose: () => void;
}

// Schema Zod v4 Simplificado
const treinamentoSchema = z.object({
    nome: z.string()
        .min(2, "Nome muito curto")
        .transform(val => val.toUpperCase().trim()),

    dataRealizacao: z.string()
        .min(1, "Data obrigatória"),

    dataVencimento: z.string().optional().or(z.literal('')),

    descricao: z.string().optional().nullable(),

    comprovanteUrl: z.string().url("URL inválida").optional().or(z.literal('')),
});

type TreinamentoForm = z.infer<typeof treinamentoSchema>;

export function ModalTreinamentosUsuario({ usuario, onClose }: ModalProps) {
    const [treinamentos, setTreinamentos] = useState<TreinamentoRealizado[]>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✨ Estados para a Exclusão Segura
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [treinoParaExcluir, setTreinoParaExcluir] = useState<{id: string, nome: string} | null>(null);

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

    const fetchTreinamentos = async () => {
        setLoading(true);
        try {
            const response = await api.get<TreinamentoRealizado[]>(`/treinamentos/usuario/${usuario.id}`);

            const sorted = response.data.sort((a, b) =>
                new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime()
            );
            setTreinamentos(sorted);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setTreinamentos([]);
            } else {
                console.error(err);
                toast.error("Erro ao carregar histórico de certificações.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreinamentos();
    }, [usuario.id]);

    const onSubmit = async (data: TreinamentoForm) => {
        const payload = {
            userId: usuario.id,
            nome: data.nome,
            dataRealizacao: new Date(data.dataRealizacao).toISOString(),
            dataVencimento: data.dataVencimento ? new Date(data.dataVencimento).toISOString() : null,
            descricao: data.descricao || null,
            comprovanteUrl: data.comprovanteUrl || null
        };

        const promise = api.post('/treinamentos', payload);

        toast.promise(promise, {
            loading: 'A registar treinamento...',
            success: () => {
                reset();
                fetchTreinamentos();
                return 'Certificação inserida com sucesso!';
            },
            error: 'Falha ao salvar a certificação.'
        });
    };

    // --- NOVA LÓGICA DE EXCLUSÃO (ConfirmModal) ---
    const executeDelete = async () => {
        if (!treinoParaExcluir) return;

        setDeletingId(treinoParaExcluir.id);
        const promise = api.delete(`/treinamentos/${treinoParaExcluir.id}`);

        toast.promise(promise, {
            loading: 'A remover registo...',
            success: () => {
                setTreinamentos(prev => prev.filter(t => t.id !== treinoParaExcluir.id));
                setDeletingId(null);
                setTreinoParaExcluir(null); // Fecha o modal
                return 'Registo removido com sucesso.';
            },
            error: () => {
                setDeletingId(null);
                setTreinoParaExcluir(null);
                return 'Erro ao excluir registo da base de dados.';
            }
        });
    };

    // --- IMPORTAÇÃO VIA EXCELJS ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const importTask = async () => {
            const workbook = new ExcelJS.Workbook();
            const buffer = await file.arrayBuffer();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            const rawData: any[] = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Pula cabeçalho
                    const getCellValue = (colIndex: number) => {
                        const cell = row.getCell(colIndex).value;
                        if (cell && typeof cell === 'object') {
                            if ('text' in cell) return cell.text;
                            if ('result' in cell) return cell.result;
                        }
                        if (cell instanceof Date) {
                            return cell.toISOString().split('T')[0];
                        }
                        return cell;
                    };

                    rawData.push({
                        nome: String(getCellValue(1) || '').trim(),
                        dataRealizacao: String(getCellValue(2) || ''),
                        dataVencimento: String(getCellValue(3) || ''),
                        descricao: String(getCellValue(4) || '').trim() || null
                    });
                }
            });

            const validos = rawData
                .map(item => {
                    if (!item.dataRealizacao) return null;
                    if (item.dataRealizacao.includes('/')) {
                        const [d, m, y] = item.dataRealizacao.split('/');
                        item.dataRealizacao = `${y}-${m}-${d}`;
                    }
                    if (item.dataVencimento && item.dataVencimento.includes('/')) {
                        const [d, m, y] = item.dataVencimento.split('/');
                        item.dataVencimento = `${y}-${m}-${d}`;
                    }

                    const result = treinamentoSchema.safeParse(item);
                    return result.success ? { ...result.data, userId: usuario.id } : null;
                })
                .filter((item): item is any => item !== null);

            if (validos.length === 0) throw new Error("Nenhum dado válido encontrado na folha de cálculo.");

            await api.post('/treinamentos/importar', {
                userId: usuario.id,
                treinamentos: validos
            });

            return validos.length;
        };

        toast.promise(importTask(), {
            loading: 'A ler folha de cálculo...',
            success: (count) => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchTreinamentos();
                return `${count} certificações importadas!`;
            },
            error: (err) => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                return err.message || "Falha na importação do ficheiro.";
            }
        });
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-background rounded-[2.5rem] shadow-float border border-border/60 w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
                onClick={e => e.stopPropagation()}
            >
                {/* ESQUERDA: FORMULÁRIO */}
                <div className="w-full md:w-[420px] bg-surface p-8 border-r border-border/60 overflow-y-auto flex flex-col custom-scrollbar">
                    
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
                            <Plus className="w-4 h-4 text-primary" /> Novo Registo
                        </h4>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Observações Adicionais</label>
                                <textarea
                                    {...register('descricao')}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 text-sm font-medium border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-24 resize-none bg-background transition-all placeholder:text-text-muted/60"
                                    placeholder="Carga horária, entidade formadora..."
                                />
                            </div>

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
                            <h3 className="text-2xl font-black text-text-main tracking-tight">Registo de Formação</h3>
                            <p className="text-sm font-medium text-text-secondary mt-1 opacity-90">Monitorize a validade técnica e conformidade deste colaborador.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-full hover:bg-surface-hover text-text-muted hover:text-error transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-background custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60 gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary"></div>
                                <p className="text-sm text-text-secondary font-bold uppercase tracking-widest animate-pulse">A carregar registos...</p>
                            </div>
                        ) : treinamentos.length === 0 ? (
                            
                            // ✨ NOSSO EMPTY STATE ELEGANTE
                            <div className="h-full flex items-center justify-center">
                                <EmptyState 
                                    icon={GraduationCap} 
                                    title="Sem Formação Registada" 
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
                                                <button
                                                    onClick={() => setTreinoParaExcluir({id: treino.id, nome: treino.nome})}
                                                    disabled={deletingId === treino.id}
                                                    className="p-2.5 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all shadow-sm bg-surface-hover"
                                                    title="Excluir Registo"
                                                >
                                                    {deletingId === treino.id ? (
                                                        <Loader2 className="animate-spin h-4 w-4 text-error" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✨ O NOSSO CONFIRM MODAL SUBSTITUINDO O ALERTA NATIVO */}
            <ConfirmModal 
                isOpen={!!treinoParaExcluir}
                onCancel={() => setTreinoParaExcluir(null)}
                onConfirm={executeDelete}
                title="Excluir Certificação"
                description={`Tem a certeza que deseja remover o registo de "${treinoParaExcluir?.nome}" do histórico deste colaborador?`}
                variant="danger"
                confirmLabel={deletingId ? "A remover..." : "Sim, Remover"}
            />

        </div>
    );
}