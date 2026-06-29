import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePasskeyGuard } from '../hooks/usePasskeyGuard';
import { BiometryRegisterModal } from './BiometryRegisterModal';
import { Fingerprint, X, Zap } from 'lucide-react';
import { Button } from './ui/Button';

export function BiometryOnboardingBanner() {
    const { hasPasskeys, isWebAuthnSupported, isLoadingPasskeys } = usePasskeyGuard();
    const [isDismissed, setIsDismissed] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Só renderiza se for suportado e se o usuário não tiver passkey, e já carregou
        if (!isWebAuthnSupported || hasPasskeys || isLoadingPasskeys) return;

        // Verifica se foi dispensado nos últimos 7 dias
        const dismissedAt = localStorage.getItem('dismissedBiometryBanner');
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) return; // Suprime
        }

        // Aguarda 2 segundos após login para não ser agressivo
        const timer = setTimeout(() => setIsDismissed(false), 2000);
        return () => clearTimeout(timer);
    }, [hasPasskeys, isWebAuthnSupported, isLoadingPasskeys]);

    const handleDismiss = () => {
        localStorage.setItem('dismissedBiometryBanner', Date.now().toString());
        setIsDismissed(true);
    };

    if (isDismissed || hasPasskeys || !isWebAuthnSupported) return null;

    return (
        <>
            <AnimatePresence>
                {!isDismissed && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
                    >
                        <div className="bg-surface/90 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10 rounded-2xl p-4 pr-12 relative overflow-hidden group">
                            {/* Efeito luminoso de fundo */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Fingerprint className="w-5 h-5 text-primary animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-text-main flex items-center gap-1.5">
                                        Acesse mais rápido! <Zap className="w-4 h-4 text-primary" />
                                    </h3>
                                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                        Cadastre sua digital ou rosto neste dispositivo para não precisar mais digitar senha.
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <Button
                                            size="sm"
                                            onClick={() => { setIsModalOpen(true); handleDismiss(); }}
                                            className="h-8 px-4 text-xs font-bold"
                                        >
                                            Cadastrar Agora
                                        </Button>
                                        <button
                                            onClick={handleDismiss}
                                            className="text-xs font-bold text-text-muted hover:text-text-main transition-colors"
                                        >
                                            Lembrar depois
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Botão Fechar X */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BiometryRegisterModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}
