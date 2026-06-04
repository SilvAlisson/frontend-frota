import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useWebAuthn, type PasskeyDevice } from '../hooks/useWebAuthn';
import { usePasskeyGuard } from '../hooks/usePasskeyGuard';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../services/api';
import {
    User, Shield, Key, Smartphone, Monitor, Trash2,
    Plus, Lock, Eye, EyeOff, CheckCircle, Fingerprint,
    Calendar, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const alterarSenhaSchema = z.object({
    senhaAtual: z.string().min(1, 'Digite sua senha atual'),
    novaSenha: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
}).refine(d => d.novaSenha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
});

type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>;

// ─── Componente: Ícone do dispositivo ─────────────────────────────────────
function DeviceIcon({ deviceType }: { deviceType: string }) {
    const isMobile = /phone|mobile|android|ios/i.test(deviceType);
    const Icon = isMobile ? Smartphone : Monitor;
    return (
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
        </div>
    );
}

// ─── Componente: Card de passkey ───────────────────────────────────────────
function PasskeyCard({
    pk,
    onRevoke,
    isRevoking,
}: {
    pk: PasskeyDevice;
    onRevoke: (id: string) => void;
    isRevoking: boolean;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const date = pk.createdAt
        ? new Date(pk.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Data desconhecida';

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-4 bg-surface/60 border border-border/40 rounded-2xl group hover:border-primary/30 transition-all"
            >
                <DeviceIcon deviceType={pk.deviceType} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-text-main truncate">
                        {pk.name || `Dispositivo ${pk.deviceType}`}
                    </p>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Cadastrado em {date}
                    </p>
                </div>
                <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={isRevoking}
                    className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Revogar acesso deste dispositivo"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </motion.div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Revogar Dispositivo"
                description={`Remover "${pk.name || 'este dispositivo'}" significa que ele não poderá mais ser usado para login biométrico. Você precisará cadastrar novamente se quiser usá-lo.`}
                variant="danger"
                confirmLabel="Sim, Revogar"
                onConfirm={() => { setConfirmOpen(false); onRevoke(pk.id); }}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}

// ─── Componente Principal ──────────────────────────────────────────────────
export function MinhaContaPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        passkeys,
        isLoadingPasskeys,
        isRegistering,
        isRevoking,
        registerDevice,
        revokePasskey,
    } = useWebAuthn();
    const { isWebAuthnSupported } = usePasskeyGuard();

    const [showSenhaAtual, setShowSenhaAtual] = useState(false);
    const [showNovaSenha, setShowNovaSenha] = useState(false);
    const [isAlterandoSenha, setIsAlterandoSenha] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<AlterarSenhaForm>({
        resolver: zodResolver(alterarSenhaSchema)
    });

    const onAlterarSenha = async (data: AlterarSenhaForm) => {
        setIsAlterandoSenha(true);
        try {
            await api.put('/users/me/password', {
                senhaAtual: data.senhaAtual,
                novaSenha: data.novaSenha,
            });
            toast.success('Senha alterada com sucesso!');
            reset();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Erro ao alterar senha.');
        } finally {
            setIsAlterandoSenha(false);
        }
    };

    if (!user) return null;

    const roleLabel: Record<string, string> = {
        ADMIN: 'Administrador',
        COORDENADOR: 'Coordenador',
        RH: 'Recursos Humanos',
        ENCARREGADO: 'Encarregado',
        OPERADOR: 'Operador',
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-text-muted" />
                </button>
                <h1 className="text-lg font-black text-text-main tracking-tight">Minha Conta</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

                {/* ── SEÇÃO: Perfil ─────────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface/50 border border-border/40 rounded-3xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-base font-black text-text-main uppercase tracking-widest">Perfil</h2>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <Avatar nome={user.nome} url={user.fotoUrl} className="w-16 h-16 text-xl flex-shrink-0" />
                        <div>
                            <p className="text-xl font-black text-text-main">{user.nome}</p>
                            <p className="text-sm text-text-muted">{user.email}</p>
                            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
                                {roleLabel[user.role] || user.role}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {user.matricula && (
                            <div className="bg-surface-hover/50 rounded-2xl p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Matrícula</p>
                                <p className="text-sm font-bold text-text-main">{user.matricula}</p>
                            </div>
                        )}
                        {(user as any).cargo && (
                            <div className="bg-surface-hover/50 rounded-2xl p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Cargo</p>
                                <p className="text-sm font-bold text-text-main">{(user as any).cargo?.nome || (user as any).cargo}</p>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* ── SEÇÃO: Dispositivos Biométricos ───────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-surface/50 border border-border/40 rounded-3xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Fingerprint className="w-4 h-4 text-primary" />
                            </div>
                            <h2 className="text-base font-black text-text-main uppercase tracking-widest">Biometria</h2>
                        </div>
                        {!isWebAuthnSupported && (
                            <span className="text-[10px] bg-warning/10 text-warning border border-warning/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                Não Suportado
                            </span>
                        )}
                    </div>

                    {/* Lista de dispositivos */}
                    {isLoadingPasskeys ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 bg-surface-hover/50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : passkeys.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-border/40 flex items-center justify-center mx-auto mb-3">
                                <Fingerprint className="w-7 h-7 text-text-muted opacity-50" />
                            </div>
                            <p className="text-sm font-bold text-text-main mb-1">Nenhum dispositivo cadastrado</p>
                            <p className="text-xs text-text-muted max-w-xs mx-auto">
                                Cadastre sua digital ou rosto para entrar sem digitar senha.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 mb-4">
                            <AnimatePresence>
                                {passkeys.map(pk => (
                                    <PasskeyCard
                                        key={pk.id}
                                        pk={pk}
                                        onRevoke={revokePasskey}
                                        isRevoking={isRevoking}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Botão Adicionar */}
                    {isWebAuthnSupported && (
                        <Button
                            onClick={registerDevice}
                            isLoading={isRegistering}
                            disabled={isRegistering}
                            variant="secondary"
                            className="w-full h-11 mt-3 border-primary/30 hover:bg-primary/5 text-primary font-bold"
                            icon={!isRegistering ? <Plus className="w-4 h-4" /> : undefined}
                        >
                            {isRegistering ? 'Aguardando Biometria...' : 'Adicionar Este Dispositivo'}
                        </Button>
                    )}

                    {!isWebAuthnSupported && (
                        <div className="mt-3 p-3 bg-warning/5 border border-warning/20 rounded-2xl text-xs text-warning font-medium">
                            Seu navegador ou dispositivo não suporta autenticação biométrica (WebAuthn/FIDO2).
                            Tente com Chrome, Safari ou Edge em um dispositivo com leitor biométrico.
                        </div>
                    )}
                </motion.section>

                {/* ── SEÇÃO: Alterar Senha ───────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-surface/50 border border-border/40 rounded-3xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-base font-black text-text-main uppercase tracking-widest">Alterar Senha</h2>
                    </div>

                    <form onSubmit={handleSubmit(onAlterarSenha)} className="space-y-4">
                        {/* Senha Atual */}
                        <div>
                            <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-1.5">
                                Senha Atual
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type={showSenhaAtual ? 'text' : 'password'}
                                    {...register('senhaAtual')}
                                    className="w-full h-11 pl-10 pr-10 bg-surface border border-border/60 rounded-xl text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSenhaAtual(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                                >
                                    {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.senhaAtual && <p className="text-xs text-error mt-1">{errors.senhaAtual.message}</p>}
                        </div>

                        {/* Nova Senha */}
                        <div>
                            <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-1.5">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type={showNovaSenha ? 'text' : 'password'}
                                    {...register('novaSenha')}
                                    className="w-full h-11 pl-10 pr-10 bg-surface border border-border/60 rounded-xl text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                                    placeholder="Mín. 8 caracteres"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNovaSenha(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                                >
                                    {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.novaSenha && <p className="text-xs text-error mt-1">{errors.novaSenha.message}</p>}
                        </div>

                        {/* Confirmar Nova Senha */}
                        <div>
                            <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-1.5">
                                Confirmar Nova Senha
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="password"
                                    {...register('confirmarSenha')}
                                    className="w-full h-11 pl-10 pr-4 bg-surface border border-border/60 rounded-xl text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                                    placeholder="Repita a nova senha"
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.confirmarSenha && <p className="text-xs text-error mt-1">{errors.confirmarSenha.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isAlterandoSenha}
                            disabled={isAlterandoSenha}
                            className="w-full h-11 font-black uppercase tracking-widest mt-2"
                            icon={!isAlterandoSenha ? <CheckCircle className="w-4 h-4" /> : undefined}
                        >
                            {isAlterandoSenha ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                    </form>
                </motion.section>

            </div>
        </div>
    );
}
