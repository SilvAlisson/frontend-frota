import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useTreinamentosUsuario,
    treinamentoSchema,
    type TreinamentoForm,
} from '../../hooks/useTreinamentosUsuario';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import {
    Trash2, AlertTriangle, Loader2,
    CheckCircle2, FileSpreadsheet, Plus, GraduationCap,
    UploadCloud, QrCode, Printer, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useModalStore } from '../../hooks/useModalStore';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { hapticError } from '../../lib/haptics';
import { toast } from 'sonner';
import { uploadToR2 } from '../../services/uploadService';

interface StatusConfig {
    indicatorBg: string;
    badgeBg: string;
    textColor: string;
    border: string;
    Icon: LucideIcon;
    label: string;
}

function getStatusConfig(vencimento: string | null | undefined, statusBase?: 'CONCLUIDO' | 'PENDENTE' | 'FALTANTE'): StatusConfig {
    if (statusBase === 'PENDENTE') {
        return {
            indicatorBg: 'bg-border/60',
            badgeBg: 'bg-surface-hover',
            textColor: 'text-text-secondary',
            border: 'border-border',
            Icon: AlertTriangle,
            label: 'Aguardando Análise',
        };
    }

    if (statusBase === 'FALTANTE') {
        return {
            indicatorBg: 'bg-error',
            badgeBg: 'bg-error/10',
            textColor: 'text-error',
            border: 'border-error/20',
            Icon: AlertTriangle,
            label: 'Obrigatório (Faltante)',
        };
    }

    if (!vencimento) {
        return {
            indicatorBg: 'bg-info',
            badgeBg: 'bg-info/10',
            textColor: 'text-info',
            border: 'border-info/20',
            Icon: CheckCircle2,
            label: 'Vitalício',
        };
    }

    const [year, month, day] = vencimento.split('T')[0].split('-').map(Number);
    const vencUTC = Date.UTC(year, month - 1, day);
    const now = new Date();
    const hojeUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDias = Math.ceil((vencUTC - hojeUTC) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
        return {
            indicatorBg: 'bg-error',
            badgeBg: 'bg-error/10',
            textColor: 'text-error',
            border: 'border-error/20',
            Icon: AlertTriangle,
            label: 'Vencido',
        };
    }
    if (diffDias < 30) {
        return {
            indicatorBg: 'bg-orange-500',
            badgeBg: 'bg-orange-500/10',
            textColor: 'text-orange-600',
            border: 'border-orange-500/20',
            Icon: AlertTriangle,
            label: 'Expira Brevemente',
        };
    }
    return {
        indicatorBg: 'bg-success',
        badgeBg: 'bg-success/10',
        textColor: 'text-success',
        border: 'border-success/20',
        Icon: CheckCircle2,
        label: 'Válido',
    };
}

export function AbaTreinamentos({ userId, nomeUsuario, role, cargoId }: { userId: string, nomeUsuario: string, role?: string, cargoId?: string | null }) {
    const { openModal, closeModal } = useModalStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowAddForm(false);
            }
        };
        if (showAddForm) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAddForm]);

    const {
        treinamentos,
        cargos,
        loading,
        addTreinamento,
        removeTreinamento,
        importarPlanilha
    } = useTreinamentosUsuario(userId, cargoId);

    const sugestoesDeTreinamentos = useMemo(() => {
        if (!cargos) return [];
        const todasAsObrigacoes = cargos.flatMap(c => c.requisitos || []).map(r => r.nome);
        return Array.from(new Set(todasAsObrigacoes)).sort();
    }, [cargos]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TreinamentoForm>({
        resolver: zodResolver(treinamentoSchema),
        defaultValues: {
            diasAntecedenciaAlerta: 30,
        },
    });

    const onSubmit = async (data: TreinamentoForm) => {
        try {
            setIsUploading(true);
            let comprovanteUrl: string | undefined;

            if (certificadoFile) {
                toast.loading('Fazendo upload do certificado...', { id: 'upload-cert' });
                try {
                    // Blindagem Dupla: Sanitiza o nome do arquivo para garantir passagem pelo Regex do backend
                    const safeName = certificadoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    const fileName = `certificado-${Date.now()}-${safeName}`;
                    
                    comprovanteUrl = await uploadToR2(
                        certificadoFile,
                        fileName,
                        certificadoFile.type || 'application/pdf',
                        'certificados'
                    );
                    toast.dismiss('upload-cert');
                } catch {
                    toast.dismiss('upload-cert');
                    hapticError();
                    toast.error('Falha no upload do certificado. Verifique o arquivo e tente novamente.');
                    return; // Interrompe se o upload falhar
                }
            }

            await addTreinamento({ ...data, comprovanteUrl });
            reset();
            setCertificadoFile(null);
            setShowAddForm(false);
        } finally {
            setIsUploading(false);
        }
    };

    const confirmExclusao = (id: string, nome: string) => {
        const modalId = openModal('CONFIRM', {
            title: 'Excluir Certificação',
            description: `Tem certeza que deseja remover o registro de "${nome}" do histórico?`,
            variant: 'danger',
            confirmLabel: 'Sim, Remover',
            onConfirm: async () => {
                setDeletingId(id);
                try {
                    await removeTreinamento(id);
                } finally {
                    setDeletingId(null);
                    closeModal(modalId);
                }
            },
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            await importarPlanilha(file);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const publicUrl = `${window.location.origin}/dossie/${userId}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}&margin=10`;

    const handleImprimirEtiqueta = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Etiqueta Capacete — ${nomeUsuario}</title>
                    <style>
                        @media print {
                            @page { margin: 0; size: auto; }
                            body { margin: 0; -webkit-print-color-adjust: exact; }
                        }
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            font-family: system-ui, -apple-system, sans-serif;
                            background: #fff;
                        }
                        .etiqueta {
                            text-align: center;
                            border: 2px solid #64748b;
                            padding: 15px;
                            border-radius: 8px;
                            width: fit-content;
                        }
                    </style>
                </head>
                <body>
                    <div class="etiqueta">
                        <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 900;">FROTA KLIN</h2>
                        <img src="${qrCodeImageUrl}" alt="QR Code do crachá" style="width: 140px; height: 140px; display: block; margin: 0 auto;" />
                        <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">${nomeUsuario}</p>
                        <p style="margin: 5px 0 0 0; font-size: 10px; color: #475569; font-weight: bold;">AUDITORIA DE SSMA</p>
                    </div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-primary" /> Histórico de Treinamentos
                </h3>
                <div className="flex items-center gap-3">
                    {role && ['OPERADOR', 'ENCARREGADO', 'AUXILIAR_OPERACIONAL'].includes(role) && (
                        <Button
                            variant="secondary"
                            onClick={handleImprimirEtiqueta}
                            title="Imprimir Etiqueta para Capacete"
                        >
                            <Printer className="w-4 h-4 mr-2" /> QR Code
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-success" />}
                        Importar Excel
                    </Button>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    <Button
                        variant={showAddForm ? 'secondary' : 'primary'}
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? 'Cancelar' : <><Plus className="w-4 h-4 mr-2" /> Registrar</>}
                    </Button>
                </div>
            </div>

            {/* FORMULÁRIO DE ADIÇÃO (EXPANSÍVEL / MODAL) */}
            {showAddForm && (
                <>
                    <div 
                        className="fixed inset-0 z-[90]" 
                        onClick={() => setShowAddForm(false)}
                    />
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-hover p-6 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-4 relative z-[100]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" /> Novo Treinamento / Certificação
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setShowAddForm(false)} 
                                className="p-2 text-text-muted hover:text-text-main hover:bg-surface rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Nome do Treinamento"
                                placeholder="Ex: NR-10 Básico"
                                list="treinamentos-sugeridos"
                                {...register('nome')}
                                error={errors.nome?.message}
                            />
                            <datalist id="treinamentos-sugeridos">
                                {sugestoesDeTreinamentos.map(nome => (
                                    <option key={nome} value={nome} />
                                ))}
                            </datalist>
                            <span className="text-[10px] text-text-muted mt-1 block px-1">
                                Digite para ver sugestões do catálogo oficial.
                            </span>
                        </div>

                        <div>
                            <Input
                                label="Data de Conclusão"
                                type="date"
                                {...register('dataRealizacao')}
                                error={errors.dataRealizacao?.message}
                            />
                        </div>

                        <div>
                            <Input
                                label="Data de Vencimento (Opcional)"
                                type="date"
                                {...register('dataVencimento')}
                                error={errors.dataVencimento?.message}
                                placeholder="Deixe em branco se for vitalício"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-text-secondary mb-1.5 block">
                                Anexar Certificado (PDF/Imagem)
                            </label>
                            <label className="flex items-center justify-center w-full h-[52px] px-4 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl cursor-pointer transition-colors text-sm text-text-muted font-medium bg-surface">
                                <span className="flex items-center gap-2 truncate">
                                    <UploadCloud className="w-4 h-4 text-primary shrink-0" />
                                    {certificadoFile ? certificadoFile.name : 'Clique para selecionar...'}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setCertificadoFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <Textarea
                                label="Observações (Opcional)"
                                placeholder="Carga horária, instituição provedora, etc..."
                                rows={2}
                                {...register('descricao')}
                                error={errors.descricao?.message}
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="w-full md:w-auto"
                        >
                            {(isSubmitting || isUploading) ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...</>
                            ) : (
                                'Registrar Certificação'
                            )}
                        </Button>
                    </div>
                </form>
                </>
            )}

            {/* LISTAGEM DE TREINAMENTOS */}
            <div className="space-y-4">
                {!treinamentos || treinamentos.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="Nenhum treinamento registrado"
                        description="Comece adicionando certificações ou importando uma planilha."
                        action={
                            <Button
                                variant="primary"
                                onClick={() => {
                                    reset({
                                        nome: 'Integração SSMA',
                                        dataRealizacao: new Date().toISOString().split('T')[0],
                                        diasAntecedenciaAlerta: 30
                                    });
                                    setShowAddForm(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Cadastrar Integração SSMA
                            </Button>
                        }
                    />
                ) : (
                    treinamentos.map((t) => {
                        // O hook useTreinamentosUsuario gera itens com status 'PENDENTE' se faltarem
                        const statusPass = (t.status === 'PENDENTE') ? 'PENDENTE' : 'CONCLUIDO';
                        const status = getStatusConfig(t.dataVencimento, statusPass);
                        const StatusIcon = status.Icon;
                        const isPendente = statusPass === 'PENDENTE';

                        return (
                            <div
                                key={t.id}
                                className="relative flex flex-col sm:flex-row gap-4 bg-surface border border-border/60 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
                            >
                                {/* Indicador lateral de status */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.indicatorBg}`} />

                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-4">
                                    {/* INFO PRINCIPAL */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-base font-bold text-text-main truncate" title={t.nome}>
                                                {t.nome}
                                            </h4>
                                            {!t.isObrigatorio && (
                                                <Badge variant="neutral" className="text-[10px] py-0 font-bold bg-surface-hover border-border/60 text-text-secondary">
                                                    Extra
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            <span className={`text-sm flex items-center gap-1.5 font-medium ${isPendente ? 'text-text-muted' : 'text-text-secondary'}`}>
                                                <CheckCircle2 className={`w-4 h-4 ${isPendente ? 'text-text-muted opacity-50' : 'text-success'}`} />
                                                {isPendente ? 'Aguardando envio de certificado / Não Realizado' : `Concluído em: ${new Date(t.dataRealizacao).toLocaleDateString('pt-BR')}`}
                                            </span>
                                            {t.descricao && (
                                                <span className="text-sm text-text-muted italic flex items-center gap-1.5">
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                    {t.descricao}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* BADGE STATUS & AÇÕES */}
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold shadow-sm ${status.badgeBg} ${status.textColor} ${status.border}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            {status.label}
                                            {t.dataVencimento && !isPendente && (
                                                <span className="ml-1 opacity-80 font-semibold">
                                                    ({new Date(t.dataVencimento).toLocaleDateString('pt-BR')})
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isPendente ? (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="h-8 text-xs font-bold w-full"
                                                    onClick={() => {
                                                        // Pre-fill form
                                                        reset({
                                                            nome: t.nome,
                                                            dataRealizacao: new Date().toISOString().split('T')[0],
                                                            diasAntecedenciaAlerta: (t as { diasAntecedenciaAlerta?: number }).diasAntecedenciaAlerta || 30
                                                        });
                                                        setShowAddForm(true);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Lançar
                                                </Button>
                                            ) : (
                                                <>
                                                    {t.comprovanteUrl && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-8 text-xs font-bold"
                                                            onClick={() => window.open(t.comprovanteUrl!, '_blank')}
                                                        >
                                                            Ver Certificado
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="h-8 px-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                        onClick={() => confirmExclusao(t.id, t.nome)}
                                                        disabled={deletingId === t.id}
                                                        title="Excluir Registro"
                                                    >
                                                        {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}