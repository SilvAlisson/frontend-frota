import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, X, ShieldCheck, MonitorSmartphone, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useWebAuthn } from '../hooks/useWebAuthn';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function BiometryRegisterModal({ isOpen, onClose }: Props) {
    const { registerDevice, isRegistering } = useWebAuthn();
    const [step, setStep] = useState<'INTRO' | 'SUCCESS'>('INTRO');

    useEffect(() => {
        if (isOpen) setStep('INTRO');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRegister = async () => {
        const success = await registerDevice();
        if (success) {
            setStep('SUCCESS');
            setTimeout(onClose, 3000); // Fecha sozinho
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface border border-border/50 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden z-10"
                >
                    <button
                        onClick={onClose}
                        disabled={isRegistering}
                        className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-6 pt-10 text-center">
                        {step === 'INTRO' ? (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                    <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                                        <Fingerprint className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-text-main mb-2">
                                    Ativar Biometria
                                </h3>
                                <p className="text-sm text-text-muted leading-relaxed mb-8">
                                    Use o leitor de digital ou câmera deste aparelho para entrar no sistema sem precisar de senha.
                                </p>

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleRegister}
                                        isLoading={isRegistering}
                                        disabled={isRegistering}
                                        className="w-full h-12 font-black uppercase tracking-wider"
                                        icon={!isRegistering ? <ShieldCheck className="w-5 h-5" /> : undefined}
                                    >
                                        {isRegistering ? 'Siga as instruções...' : 'Configurar Agora'}
                                    </Button>
                                    <Button
                                        onClick={onClose}
                                        disabled={isRegistering}
                                        variant="ghost"
                                        className="w-full h-12 font-bold text-text-muted hover:text-text-main"
                                    >
                                        Deixar para depois
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-6"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-success" />
                                </div>
                                <h3 className="text-2xl font-black text-text-main mb-2">Tudo Certo!</h3>
                                <p className="text-sm text-text-muted max-w-[240px] mx-auto">
                                    Dispositivo cadastrado. No próximo login, basta clicar na digital.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    <div className="bg-surface-hover/50 p-4 border-t border-border/30 flex items-center justify-center gap-2 text-xs text-text-muted font-medium">
                        <MonitorSmartphone className="w-4 h-4 opacity-70" />
                        Acesso seguro (FIDO2 WebAuthn)
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
