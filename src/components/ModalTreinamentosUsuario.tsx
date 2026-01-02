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
    X, Trash2, ExternalLink, Calendar, AlertTriangle,
    CheckCircle2, FileSpreadsheet, Plus
} from 'lucide-react';
import type { TreinamentoRealizado, User } from '../types';

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
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // [CORREÇÃO DEFINITIVA]: Rota alterada de '/user/' para '/usuario/' 
            // para corresponder ao backend (treinamento.routes.ts)
            const response = await api.get<TreinamentoRealizado[]>(`/treinamentos/usuario/${usuario.id}`);

            const sorted = response.data.sort((a, b) =>
                new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime()
            );
            setTreinamentos(sorted);
        } catch (err: any) {
            // Se o backend retornar 404 (lista vazia em alguns controllers antigos), tratamos como array vazio
            // Mas com a correção da rota, deve retornar 200 com array vazio se não houver dados.
            if (err.response?.status === 404) {
                setTreinamentos([]);
            } else {
                console.error(err);
                toast.error("Erro ao carregar histórico.");
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
            loading: 'Salvando...',
            success: () => {
                reset();
                fetchTreinamentos();
                return 'Treinamento registrado com sucesso!';
            },
            error: 'Falha ao salvar o treinamento.'
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Confirmar exclusão definitiva?")) return;

        setDeletingId(id);
        const promise = api.delete(`/treinamentos/${id}`);

        toast.promise(promise, {
            loading: 'Removendo...',
            success: () => {
                setTreinamentos(prev => prev.filter(t => t.id !== id));
                setDeletingId(null);
                return 'Removido com sucesso.';
            },
            error: () => {
                setDeletingId(null);
                return 'Erro ao excluir.';
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

            if (validos.length === 0) throw new Error("Nenhum dado válido encontrado na planilha.");

            await api.post('/treinamentos/importar', {
                userId: usuario.id,
                treinamentos: validos
            });

            return validos.length;
        };

        toast.promise(importTask(), {
            loading: 'Lendo planilha Excel...',
            success: (count) => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchTreinamentos();
                return `${count} treinamentos importados!`;
            },
            error: (err) => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                return err.message || "Falha na importação.";
            }
        });
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const getStatusInfo = (vencimento: string | null | undefined) => {
        if (!vencimento) return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2, text: 'Permanente' };

        const hoje = new Date();
        const dataVenc = new Date(vencimento);
        const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias < 0) return { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle, text: 'Vencido' };
        if (diffDias < 30) return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, text: 'Vence em breve' };
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, text: 'Válido' };
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* ESQUERDA: FORMULÁRIO */}
                <div className="w-full md:w-[380px] bg-background p-6 border-r border-border overflow-y-auto flex flex-col">
                    <div className="mb-6 flex items-center gap-3 pb-6 border-b border-border">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-sm">
                            {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">{usuario.nome}</h3>
                            <p className="text-xs text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-border w-fit mt-1">{usuario.role}</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" /> Novo Lançamento
                        </h4>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Input
                                label="Nome do Curso"
                                placeholder="Ex: NR-35, Direção Defensiva"
                                {...register('nome')}
                                error={errors.nome?.message}
                                disabled={isSubmitting}
                                className="bg-white"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Realização"
                                    type="date"
                                    {...register('dataRealizacao')}
                                    error={errors.dataRealizacao?.message}
                                    disabled={isSubmitting}
                                    className="bg-white"
                                />
                                <Input
                                    label="Vencimento"
                                    type="date"
                                    {...register('dataVencimento')}
                                    disabled={isSubmitting}
                                    className="bg-white"
                                />
                            </div>

                            <Input
                                label="Link Certificado (URL)"
                                placeholder="https://..."
                                {...register('comprovanteUrl')}
                                error={errors.comprovanteUrl?.message}
                                disabled={isSubmitting}
                                className="bg-white"
                            />

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">OBSERVAÇÕES</label>
                                <textarea
                                    {...register('descricao')}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none bg-white transition-all placeholder:text-gray-400"
                                    placeholder="Carga horária, instituição..."
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full shadow-lg shadow-primary/20 mt-2"
                                isLoading={isSubmitting}
                            >
                                Adicionar Certificado
                            </Button>
                        </form>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-[10px] text-center text-gray-400 font-bold mb-3 uppercase tracking-wide">
                            Importação em Massa
                        </p>
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full border-dashed border-border text-gray-500 hover:border-primary hover:text-primary transition-all bg-white"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            icon={<FileSpreadsheet className="w-4 h-4" />}
                        >
                            Selecionar Planilha Excel
                        </Button>
                    </div>
                </div>

                {/* DIREITA: LISTA */}
                <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Histórico de Capacitação</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Gerencie a conformidade e validade dos cursos.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary mb-3"></div>
                                <p className="text-sm text-gray-500 font-medium">Carregando registros...</p>
                            </div>
                        ) : treinamentos.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-border rounded-2xl bg-white">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h4 className="text-gray-900 font-medium">Nenhum curso registrado</h4>
                                <p className="text-sm text-gray-500 max-w-xs mt-1">O histórico deste colaborador está vazio.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {treinamentos.map(treino => {
                                    const status = getStatusInfo(treino.dataVencimento);
                                    const StatusIcon = status.icon;

                                    return (
                                        <div key={treino.id} className="group bg-white border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.color.split(' ')[0]}`}></div>
                                            <div className="flex justify-between items-start pl-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 text-base tracking-tight">{treino.nome}</h4>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-gray-500 mt-2">
                                                        <span className="flex items-center gap-1.5 bg-background px-2 py-1 rounded text-gray-600 font-medium border border-border">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            {formatDate(treino.dataRealizacao)}
                                                        </span>
                                                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded border font-bold ${status.color}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {treino.dataVencimento ? `Vence: ${formatDate(treino.dataVencimento)}` : 'Permanente'}
                                                        </span>
                                                    </div>
                                                    {treino.descricao && (
                                                        <p className="text-xs text-gray-400 mt-2.5 italic line-clamp-2">"{treino.descricao}"</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    {treino.comprovanteUrl && (
                                                        <a
                                                            href={treino.comprovanteUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                            title="Ver Certificado"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(treino.id)}
                                                        disabled={deletingId === treino.id}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Excluir"
                                                    >
                                                        {deletingId === treino.id ? (
                                                            <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
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