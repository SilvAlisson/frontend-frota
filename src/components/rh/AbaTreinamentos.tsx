import { useState, useRef } from 'react';
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
    Trash2, Calendar, AlertTriangle, Loader2,
    CheckCircle2, FileSpreadsheet, Plus, GraduationCap,
    UploadCloud, QrCode, Printer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useModalStore } from '../../hooks/useModalStore';
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

function getStatusConfig(vencimento: string | null | undefined): StatusConfig {
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
            indicatorBg: 'bg-warning-500',
            badgeBg: 'bg-warning-500/10',
            textColor: 'text-warning-600',
            border: 'border-warning-500/20',
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

export function AbaTreinamentos({ userId, nomeUsuario, role }: { userId: string, nomeUsuario: string, role?: string }) {
    const { openModal, closeModal } = useModalStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const {
        data: treinamentos,
        isLoading,
        addTreinamento,
        removeTreinamento,
        importarPlanilha,
        isImporting
    } = useTreinamentosUsuario(userId);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TreinamentoForm>({
        resolver: zodResolver(treinamentoSchema),
    });

    const onSubmit = async (data: TreinamentoForm) => {
        try {
            setIsUploading(true);
            let comprovanteUrl: string | undefined;

            if (certificadoFile) {
                try {
                    comprovanteUrl = await uploadToR2(
                        certificadoFile,
                        'certificados'
                    );
                } catch {
                    hapticError();
                    toast.error('Falha no upload do certificado. Verifique o arquivo e tente novamente.');
                    return;
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
        try {
            await importarPlanilha(file);
        } finally {
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
                            font-family: 'Inter', Arial, sans-serif;
                            background: #fff;
                        }
                        .etiqueta {
                            text-align: center;
                            border: 2px solid #000;
                            padding: 15px;
                            border-radius: 8px;
                            width: fit-content;
                        }
                    </style>
                </head>
                <body>
                    <div class="etiqueta">
                        <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 900;">FROTA KLIN</h2>
                        <img src="${qrCodeImageUrl}" style="width: 140px; height: 140px; display: block; margin: 0 auto;" />
                        <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">${nomeUsuario}</p>
                        <p style="margin: 5px 0 0 0; font-size: 10px; color: #333; font-weight: bold;">AUDITORIA DE SSMA</p>
                    </div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
    };

    if (isLoading) {
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

            {/* FORMULÁRIO DE ADIÇÃO (EXPANSÍVEL) */}
            {showAddForm && (
                <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-hover p-6 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" /> Novo Treinamento / Certificação
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Nome do Treinamento"
                                placeholder="Ex: NR-10 Básico"
                                {...register('nome')}
                                error={errors.nome?.message}
                            />
                        </div>

                        <div>
                            <Input
                                label="Data de Conclusão"
                                type="date"
                                {...register('dataConclusao')}
                                error={errors.dataConclusao?.message}
                            />
                        </div>

                        <div>
                            <Input
                                label="Data de Vencimento (Opcional)"
                                type="date"
                                {...register('dataVencimento')}
                                error={errors.dataVencimento?.message}
                                description="Deixe em branco se for vitalício"
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
                                {...register('observacoes')}
                                error={errors.observacoes?.message}
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
            )}

            {/* LISTAGEM DE TREINAMENTOS */}
            <div className="space-y-4">
                {!treinamentos || treinamentos.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="Nenhum treinamento registrado"
                        description="Comece adicionando certificações ou importando uma planilha."
                    />
                ) : (
                    treinamentos.map((t) => {
                        const status = getStatusConfig(t.dataVencimento);
                        const StatusIcon = status.Icon;

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
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            {role && ['OPERADOR', 'ENCARREGADO', 'AUXILIAR_OPERACIONAL'].includes(role) && (
                                                <Button variant="secondary" className="h-10 border-border/40 text-text-muted hover:text-text-main group" onClick={() => openModal('QR_CRACHA', { usuario: { id: userId, nome: nomeUsuario, role } })}>
                                                    <QrCode className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" /> QR Code
                                                </Button>
                                            )}
                                            <span className="text-sm text-text-secondary flex items-center gap-1.5 font-medium">
                                                <CheckCircle2 className="w-4 h-4 text-success" />
                                                Concluído em: {new Date(t.dataConclusao).toLocaleDateString('pt-BR')}
                                            </span>
                                            {t.observacoes && (
                                                <span className="text-sm text-text-muted italic flex items-center gap-1.5">
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                    {t.observacoes}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* BADGE STATUS & AÇÕES */}
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold shadow-sm ${status.badgeBg} ${status.textColor} ${status.border}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            {status.label}
                                            {t.dataVencimento && (
                                                <span className="ml-1 opacity-80 font-semibold">
                                                    ({new Date(t.dataVencimento).toLocaleDateString('pt-BR')})
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {t.certificadoUrl && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 text-xs font-bold"
                                                    onClick={() => window.open(t.certificadoUrl!, '_blank')}
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
