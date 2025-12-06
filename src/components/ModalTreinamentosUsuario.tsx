import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import type { TreinamentoRealizado, User } from '../types';

interface ModalProps {
    usuario: User;
    onClose: () => void;
}

// --- 1. SCHEMA ZOD V4 ---
const treinamentoSchema = z.object({
    nome: z.string({ error: "Nome do curso é obrigatório" })
        .min(2, { message: "Nome muito curto" })
        .transform(val => val.toUpperCase()),

    dataRealizacao: z.string({ error: "Data obrigatória" })
        .min(1, { message: "Informe a data" }),

    dataVencimento: z.string().optional().or(z.literal('')),

    descricao: z.string().optional(),

    comprovanteUrl: z.string().optional().or(z.literal('')),
});

type TreinamentoForm = z.input<typeof treinamentoSchema>;

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
        },
        mode: 'onBlur'
    });

    // --- FETCH ---
    const fetchTreinamentos = async () => {
        setLoading(true);
        try {
            const response = await api.get<TreinamentoRealizado[]>(`/treinamentos/user/${usuario.id}`);
            setTreinamentos(response.data);
        } catch (err) {
            console.error(err);
            toast.error("Não foi possível carregar o histórico.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreinamentos();
    }, [usuario.id]);

    // --- SUBMIT MANUAL ---
    const onSubmit = async (data: TreinamentoForm) => {
        const promise = api.post('/treinamentos', {
            userId: usuario.id,
            nome: data.nome,
            dataRealizacao: new Date(data.dataRealizacao).toISOString(),
            dataVencimento: data.dataVencimento ? new Date(data.dataVencimento).toISOString() : null,
            descricao: data.descricao || null,
            comprovanteUrl: data.comprovanteUrl || null
        });

        toast.promise(promise, {
            loading: 'Registrando certificação...',
            success: () => {
                reset();
                fetchTreinamentos();
                return 'Treinamento adicionado com sucesso!';
            },
            error: 'Erro ao salvar. Verifique os dados.'
        });
    };

    // --- DELETE ---
    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja remover este registro permanentemente?")) return;

        setDeletingId(id);
        const promise = api.delete(`/treinamentos/${id}`);

        toast.promise(promise, {
            loading: 'Removendo...',
            success: () => {
                setTreinamentos(prev => prev.filter(t => t.id !== id));
                setDeletingId(null);
                return 'Registro removido.';
            },
            error: () => {
                setDeletingId(null);
                return 'Falha ao remover registro.';
            }
        });
    };

    // --- IMPORTAÇÃO EXCEL ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const importPromise = new Promise<{ count: number }>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    if (data.length === 0) return reject(new Error("Planilha vazia"));

                    const treinamentosFormatados = data.map((row: any) => {
                        const nome = row['Nome'] || row['Curso'];
                        const dataRealizacaoRaw = row['Data'] || row['Realizacao'];
                        const dataVencimentoRaw = row['Vencimento'] || row['Validade'];

                        if (!nome || !dataRealizacaoRaw) return null;

                        const parseExcelDate = (val: any) => {
                            if (!val) return null;
                            if (typeof val === 'number') {
                                return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString();
                            }
                            if (typeof val === 'string' && val.includes('/')) {
                                const [d, m, y] = val.split('/');
                                return new Date(`${y}-${m}-${d}`).toISOString();
                            }
                            return new Date(val).toISOString();
                        };

                        return {
                            nome: String(nome).toUpperCase(),
                            descricao: row['Obs'] ? String(row['Obs']) : null,
                            dataRealizacao: parseExcelDate(dataRealizacaoRaw),
                            dataVencimento: parseExcelDate(dataVencimentoRaw),
                        };
                    }).filter(t => t !== null);

                    if (treinamentosFormatados.length === 0) return reject(new Error("Nenhum dado válido encontrado"));

                    await api.post('/treinamentos/importar', { userId: usuario.id, treinamentos: treinamentosFormatados });
                    resolve({ count: treinamentosFormatados.length });

                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsBinaryString(file);
        });

        toast.promise(importPromise, {
            loading: 'Processando planilha...',
            success: (res) => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchTreinamentos();
                return `${res.count} treinamentos importados com sucesso!`;
            },
            error: (err) => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                return err.message || "Erro na importação.";
            }
        });
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const getStatusColor = (vencimento: string | null | undefined) => {
        if (!vencimento) return 'bg-gray-100 text-gray-600 border-gray-200';
        const hoje = new Date();
        const dataVenc = new Date(vencimento);
        const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias < 0) return 'bg-red-50 text-red-700 border-red-200';
        if (diffDias < 30) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-green-50 text-green-700 border-green-200';
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all animate-in fade-in duration-200" onClick={onClose}>

            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >

                {/* ESQUERDA: FORMULÁRIO */}
                <div className="w-full md:w-[380px] bg-gray-50/80 p-6 border-r border-gray-100 overflow-y-auto flex flex-col">

                    {/* Info Usuário */}
                    <div className="mb-6 flex items-center gap-3 pb-6 border-b border-gray-200/60">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-4 ring-white shadow-sm">
                            {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 leading-tight">{usuario.nome}</h3>
                            <p className="text-xs text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-gray-200 w-fit mt-1">{usuario.role}</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                            Novo Lançamento
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
                                <label className="text-xs font-bold text-text-secondary ml-1">Observações</label>
                                <textarea
                                    {...register('descricao')}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-20 resize-none bg-white transition-shadow placeholder:text-gray-400"
                                    placeholder="Carga horária, instituição..."
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full shadow-lg shadow-primary/10 mt-2"
                                isLoading={isSubmitting}
                            >
                                Adicionar Certificado
                            </Button>
                        </form>
                    </div>

                    {/* Importação */}
                    <div className="mt-8 pt-6 border-t border-gray-200/60">
                        <p className="text-[10px] text-center text-gray-400 font-bold mb-3 uppercase tracking-wide">
                            Importação em Massa
                        </p>
                        <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-all bg-white"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>}
                        >
                            Selecionar Planilha Excel
                        </Button>
                    </div>
                </div>

                {/* DIREITA: LISTA */}
                <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Histórico de Capacitação</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Gerencie a conformidade e validade dos cursos.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary mb-3"></div>
                                <p className="text-sm text-gray-500 font-medium">Carregando registros...</p>
                            </div>
                        )}

                        {!loading && treinamentos.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                                </div>
                                <h4 className="text-gray-900 font-medium">Nenhum curso registrado</h4>
                                <p className="text-sm text-gray-500 max-w-xs mt-1">O histórico deste colaborador está vazio.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {treinamentos.map(treino => {
                                const statusClass = getStatusColor(treino.dataVencimento);

                                return (
                                    <div key={treino.id} className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusClass.split(' ')[0].replace('bg-', 'bg-')}`}></div>

                                        <div className="flex justify-between items-start pl-3">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-base tracking-tight">{treino.nome}</h4>

                                                <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-gray-500 mt-2">
                                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-gray-600 font-medium border border-gray-100">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        {formatDate(treino.dataRealizacao)}
                                                    </span>

                                                    {treino.dataVencimento ? (
                                                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded border ${statusClass} font-bold`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Vence: {formatDate(treino.dataVencimento)}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                                                            ∞ Permanente
                                                        </span>
                                                    )}
                                                </div>

                                                {treino.descricao && (
                                                    <p className="text-xs text-gray-400 mt-2.5 italic">"{treino.descricao}"</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {treino.comprovanteUrl && (
                                                    <a
                                                        href={treino.comprovanteUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver Certificado"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(treino.id)}
                                                    disabled={deletingId === treino.id}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Excluir"
                                                >
                                                    {deletingId === treino.id ? <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}