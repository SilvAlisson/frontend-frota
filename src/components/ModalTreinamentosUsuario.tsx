import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useTreinamentosUsuario,
    treinamentoSchema,
    type TreinamentoForm,
} from '../hooks/useTreinamentosUsuario';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import {
    X, Trash2, Calendar, AlertTriangle, Loader2,
    FileSpreadsheet, Plus, GraduationCap,
    UploadCloud, QrCode,
} from 'lucide-react';
import type { User } from '../types';
import { useModalStore } from '../hooks/useModalStore';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { hapticError } from '../lib/haptics';
import { toast } from 'sonner';
import { uploadToR2 } from '../services/uploadService';
import { useMatrizQualificacao } from '../hooks/useMatrizQualificacao';
import { XCircle } from 'lucide-react';
import { getStatusConfig, formatDate } from './rh/treinamentos/TreinamentosUtils';
import { CrachaModal } from './rh/treinamentos/CrachaModal';

// ─────────────────────────────────────────────────────────────────
// Tipos locais
// ─────────────────────────────────────────────────────────────────
interface ModalProps {
    usuario: User;
    onClose: () => void;
}


// ─────────────────────────────────────────────────────────────────
// Utilitários puros
// ─────────────────────────────────────────────────────────────────

// Utils isolados em TreinamentosUtils.ts

// ─────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────
export function ModalTreinamentosUsuario({ usuario, onClose }: ModalProps) {
    const { treinamentos, loading, addTreinamento, removeTreinamento, importarPlanilha } =
        useTreinamentosUsuario(usuario.id);
    const { data: matriz } = useMatrizQualificacao();
    const { openModal, closeModal } = useModalStore();

    const userMatriz = matriz?.find(m => m.userId === usuario.id);
    const faltantes = userMatriz?.exigencias.filter(e => e.status === 'FALTANTE') || [];

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCracha, setShowCracha] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TreinamentoForm>({
        resolver: zodResolver(treinamentoSchema),
        defaultValues: {
            nome: '',
            dataRealizacao: new Date().toISOString().split('T')[0],
            dataVencimento: '',
            descricao: '',
            comprovanteUrl: '',
            diasAntecedenciaAlerta: 30,
        },
    });

    // ── Handlers ─────────────────────────────────────────────────

    const onSubmit = async (data: TreinamentoForm) => {
        setIsUploading(true);
        try {
            let comprovanteUrl = data.comprovanteUrl;

            if (certificadoFile) {
                try {
                    comprovanteUrl = await uploadToR2(
                        certificadoFile,
                        certificadoFile.name,
                        certificadoFile.type,
                        'certificados'
                    );
                } catch {
                    hapticError();
                    toast.error('Falha no upload do certificado. Verifique o arquivo e tente novamente.');
                    return; // Interrompe antes de chamar a API
                }
            }

            await addTreinamento({ ...data, comprovanteUrl });
            reset();
            setCertificadoFile(null);
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

    // handleImprimirEtiqueta movido para CrachaModal

    // ── Dados derivados ───────────────────────────────────────────
    const isBusy = isSubmitting || isUploading;
    const publicUrl = `${window.location.origin}/dossie/${usuario.id}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}&margin=10`;
    const inicialNome = usuario.nome.charAt(0).toUpperCase();

    // ── Render ────────────────────────────────────────────────────
    return (
        <>
            {/* ── Backdrop + Container ──────────────────────────── */}
            <div
                className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
                onClick={onClose}
            >
                <div
                    className="bg-background rounded-[2.5rem] shadow-float border border-border/60 w-full max-w-5xl h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Botão de Fechar Mobile Absoluto */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="md:hidden absolute top-5 right-5 z-50 rounded-full bg-surface-hover shadow-sm border border-border/40 text-text-muted hover:text-error h-10 w-10 flex items-center justify-center"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    {/* ─── PAINEL ESQUERDO: FORMULÁRIO ────────────────── */}
                    <div className="w-full md:w-[420px] bg-surface p-5 sm:p-8 border-b md:border-b-0 md:border-r border-border/60 md:overflow-y-auto flex flex-col scrollbar-thin shrink-0">

                        {/* Cabeçalho do usuário */}
                        <div className="mb-6 md:mb-8 flex items-center gap-4 pb-6 border-b border-border/60 pr-12 md:pr-0">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 shadow-inner shrink-0">
                                {inicialNome}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-lg font-black text-text-main leading-tight truncate">
                                    {usuario.nome}
                                </h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-surface-hover px-2 py-0.5 rounded-md border border-border/60 w-fit mt-1.5">
                                    {usuario.role}
                                </p>
                            </div>
                        </div>

                        {/* Título Mobile Only */}
                        <div className="md:hidden mb-8">
                            <h3 className="text-2xl font-black text-text-main tracking-tight">
                                Prontuário Digital SSMA
                            </h3>
                            <p className="text-sm font-medium text-text-secondary mt-1 opacity-90">
                                Dossiê completo de certificações, ASO e requisitos do cargo.
                            </p>
                        </div>

                        {/* Formulário */}
                        <div className="flex-1">
                            <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" /> Novo Registro
                            </h4>

                            <form
                                onSubmit={handleSubmit(onSubmit, () => hapticError())}
                                className="space-y-5"
                            >
                                <Input
                                    label="Nome da Certificação"
                                    placeholder="Ex: Direção Defensiva, NR-35..."
                                    {...register('nome')}
                                    error={errors.nome?.message}
                                    disabled={isBusy}
                                    className="bg-background"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Data de Emissão"
                                        type="date"
                                        {...register('dataRealizacao')}
                                        error={errors.dataRealizacao?.message}
                                        disabled={isBusy}
                                        className="bg-background"
                                    />
                                    <Input
                                        label="Data de Validade"
                                        type="date"
                                        {...register('dataVencimento')}
                                        disabled={isBusy}
                                        className="bg-background"
                                    />
                                </div>

                                <Input
                                    label="Avisar Vencimento (em dias)"
                                    type="number"
                                    placeholder="Ex: 30, 45, 60"
                                    title="Com quantos dias de antecedência o sistema deve gerar um alerta?"
                                    {...register('diasAntecedenciaAlerta', { valueAsNumber: true })}
                                    error={errors.diasAntecedenciaAlerta?.message}
                                    disabled={isBusy}
                                    className="bg-background"
                                />

                                {/* Upload de certificado */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-text-muted uppercase tracking-widest block">
                                        Anexar Certificado (PDF / Imagem)
                                    </label>
                                    <label
                                        className={[
                                            'flex flex-col items-center justify-center w-full h-16 px-4',
                                            'transition-all bg-surface border-2 border-dashed rounded-xl cursor-pointer',
                                            certificadoFile
                                                ? 'border-primary/50 bg-primary/5'
                                                : 'border-border/60 hover:border-primary/40 hover:bg-surface-hover',
                                        ].join(' ')}
                                    >
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,image/*"
                                            onChange={e => setCertificadoFile(e.target.files?.[0] ?? null)}
                                            disabled={isBusy}
                                        />
                                        <div className="flex items-center gap-2 text-sm font-bold text-text-secondary truncate w-full justify-center">
                                            <UploadCloud
                                                className={`w-4 h-4 shrink-0 ${certificadoFile ? 'text-primary' : 'text-text-muted'}`}
                                            />
                                            <span className="truncate">
                                                {certificadoFile
                                                    ? certificadoFile.name
                                                    : 'Clique para selecionar arquivo...'}
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <Textarea
                                    label="Observações Adicionais"
                                    {...register('descricao')}
                                    disabled={isBusy}
                                    rows={2}
                                    placeholder="Carga horária, entidade formadora..."
                                    autoResize={false}
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full shadow-button hover:shadow-float-primary mt-4 h-12 text-sm uppercase tracking-widest"
                                    isLoading={isBusy}
                                    disabled={isBusy}
                                >
                                    {isUploading ? 'Enviando Arquivo...' : 'Inserir Certificação'}
                                </Button>
                            </form>
                        </div>

                        {/* Importação em massa */}
                        <div className="mt-8 pt-6 border-t border-border/60">
                            <p className="text-[9px] text-center text-text-muted font-black mb-3 uppercase tracking-[0.2em]">
                                Importação em Massa
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-dashed border-border/60 text-text-secondary hover:border-primary/50 hover:text-primary transition-all bg-background h-12"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isBusy}
                                icon={<FileSpreadsheet className="w-4 h-4" />}
                            >
                                Upload de Planilha Excel
                            </Button>
                        </div>
                    </div>

                    {/* ─── PAINEL DIREITO: LISTAGEM ────────────────────── */}
                    <div className="flex-1 bg-background flex flex-col md:h-full md:overflow-hidden shrink-0">

                        {/* Header fixo - DESKTOP ONLY */}
                        <div className="hidden md:flex p-6 sm:p-8 border-b border-border/60 justify-between items-center bg-surface sticky top-0 z-10 shrink-0 gap-4">
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-text-main tracking-tight">
                                    Prontuário Digital SSMA
                                </h3>
                                <p className="text-sm font-medium text-text-secondary mt-1 opacity-90">
                                    Dossiê completo de certificações, ASO e requisitos do cargo.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowCracha(true)}
                                    className="hidden sm:flex border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary whitespace-nowrap"
                                    icon={<QrCode className="w-4 h-4" />}
                                >
                                    Crachá Público
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-surface-hover text-text-muted hover:text-error transition-colors shrink-0"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Listagem */}
                        <div className="flex-1 md:overflow-y-auto p-6 sm:p-8 bg-background scrollbar-thin">
                            {/* Botão crachá — mobile only */}
                            <Button
                                variant="secondary"
                                onClick={() => setShowCracha(true)}
                                className="w-full sm:hidden mb-6 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                                icon={<QrCode className="w-4 h-4" />}
                            >
                                Gerar Crachá Público
                            </Button>

                            {/* PENDÊNCIAS OBRIGATÓRIAS */}
                            {faltantes.length > 0 && (
                                <div className="mb-8 space-y-3">
                                    <h4 className="text-xs font-black text-error uppercase tracking-[0.2em] flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Pendências do Cargo
                                    </h4>
                                    {faltantes.map(f => (
                                        <div key={f.nome} className="bg-error/5 border border-error/20 rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center">
                                                    <XCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-error">{f.nome}</p>
                                                    <p className="text-xs text-error/80">Requisito obrigatório não realizado</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {loading ? (
                                <div className="grid gap-4 auto-rows-max">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton
                                            key={i}
                                            className="h-32 w-full rounded-2xl border border-border/40"
                                        />
                                    ))}
                                </div>
                            ) : treinamentos.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <EmptyState
                                        icon={GraduationCap}
                                        title="Sem Formação Registrada"
                                        description="Este integrante ainda não possui histórico de cursos no sistema."
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-4 auto-rows-max">
                                    {treinamentos.map(treino => {
                                        const status = getStatusConfig(treino.dataVencimento);
                                        const { Icon: StatusIcon } = status;

                                        return (
                                            <div
                                                key={treino.id}
                                                className="group bg-surface border border-border/60 rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                            >
                                                {/* Indicador lateral de status */}
                                                <div
                                                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.indicatorBg}`}
                                                />

                                                {/* Conteúdo principal */}
                                                <div className="flex-1 pl-2 min-w-0">
                                                    <h4
                                                        className="font-black text-text-main text-lg tracking-tight truncate"
                                                        title={treino.nome}
                                                    >
                                                        {treino.nome}
                                                    </h4>

                                                    <div className="flex flex-wrap gap-x-3 gap-y-2 mt-2">
                                                        <span className="flex items-center gap-1.5 bg-surface-hover px-2.5 py-1 rounded-md text-[10px] text-text-secondary font-bold uppercase tracking-widest border border-border/60">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(treino.dataRealizacao)}
                                                        </span>
                                                        <span
                                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${status.badgeBg} ${status.textColor} ${status.border}`}
                                                        >
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {status.label}
                                                        </span>
                                                    </div>

                                                    {treino.descricao && (
                                                        <p className="text-xs text-text-secondary mt-3 font-medium line-clamp-2">
                                                            "{treino.descricao}"
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Ações */}
                                                <div className="flex items-center gap-2 pl-2 w-full sm:w-auto justify-end sm:justify-start border-t border-dashed border-border/60 sm:border-none pt-3 sm:pt-0">
                                                    {treino.comprovanteUrl && (
                                                        <a
                                                            href={treino.comprovanteUrl}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 shadow-sm bg-surface-hover flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                                                        >
                                                            <FileSpreadsheet className="w-4 h-4" /> PDF
                                                        </a>
                                                    )}
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => confirmExclusao(treino.id, treino.nome)}
                                                        disabled={deletingId === treino.id}
                                                        className="w-10 h-10 bg-surface-hover text-text-muted hover:text-error hover:bg-error/10 border-transparent shadow-sm"
                                                        title="Excluir Registro"
                                                        icon={
                                                            deletingId === treino.id
                                                                ? <Loader2 className="animate-spin h-4 w-4 text-error" />
                                                                : <Trash2 className="w-4 h-4" />
                                                        }
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

            {/* ─── MODAL DO CRACHÁ ──────────────────────────────── */}
            {showCracha && (
                <CrachaModal
                    usuario={usuario}
                    qrCodeImageUrl={qrCodeImageUrl}
                    onClose={() => setShowCracha(false)}
                />
            )}
        </>
    );
}
