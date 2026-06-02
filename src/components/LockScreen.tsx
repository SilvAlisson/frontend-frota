import { Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../utils/haptics';

interface LockScreenProps {
  onUnlock: () => void;
  onUsePassword: () => void;
  isAuthenticating: boolean;
}

export function LockScreen({ onUnlock, onUsePassword, isAuthenticating }: LockScreenProps) {
  
  const handleTouch = () => {
    // CORREÇÃO: Utilizando o método 'light' que existe na sua tipagem estrita
    haptics.light();
    onUnlock();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Decorativo e Imersivo */}
      <div className="absolute inset-0 bg-slate-950"></div>
      
      {/* Círculo de luz de fundo (Glow) que pulsa suavemente */}
      <motion.div 
        animate={{ 
          scale: isAuthenticating ? [1, 1.2, 1] : 1,
          opacity: isAuthenticating ? [0.1, 0.2, 0.1] : 0.1
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6 h-full py-12">
        
        {/* Header Animado */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-header font-black tracking-tighter text-white mb-2 drop-shadow-md">
            FROTA <span className="text-primary">KLIN</span>
          </h1>
          <p className="text-zinc-400 font-medium text-sm uppercase tracking-widest">
            Acesso Restrito
          </p>
        </motion.div>

        {/* Botão Biomético com Física de Mola */}
        <motion.button
          type="button"
          onClick={handleTouch}
          disabled={isAuthenticating}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center justify-center mb-8 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 rounded-full"
          aria-label="Tocar para desbloquear com biometria"
        >
          {/* Anéis de energia que aparecem no Hover/Auth */}
          <AnimatePresence>
            {isAuthenticating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.5, 1.8] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-primary rounded-full blur-md"
              />
            )}
          </AnimatePresence>
          
          <div className={`
            relative flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full 
            border border-white/10 shadow-2xl transition-colors duration-500 overflow-hidden
            ${isAuthenticating ? 'bg-primary/10 border-primary/50' : 'bg-white/5 backdrop-blur-xl hover:bg-white/10'}
          `}>
            
            {/* Efeito Scanning Nativo do Framer Motion */}
            <AnimatePresence>
              {isAuthenticating && (
                <motion.div 
                  initial={{ y: '-100%' }}
                  animate={{ y: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatType: "reverse" }}
                  className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent to-primary/30 rounded-t-full border-b border-primary"
                />
              )}
            </AnimatePresence>

            <Fingerprint 
              className={`w-14 h-14 sm:w-16 sm:h-16 transition-colors duration-300 relative z-10 ${
                isAuthenticating ? 'text-primary' : 'text-white/80'
              }`} 
              strokeWidth={1}
            />
          </div>
        </motion.button>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-xs sm:text-sm font-black tracking-[0.2em] uppercase transition-colors duration-300 mb-auto mt-4 ${
            isAuthenticating ? 'text-primary animate-pulse' : 'text-zinc-500'
          }`}
        >
          {isAuthenticating ? 'Verificando...' : 'Toque para acessar'}
        </motion.p>

        {/* Rodapé: Usar Senha Padrão */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.4 }}
          className="mt-12 w-full max-w-[200px]"
        >
          <Button
            variant="ghost"
            onClick={onUsePassword}
            className="w-full text-zinc-400 hover:text-white hover:bg-white/5 tracking-widest uppercase text-[10px] sm:text-xs font-bold rounded-2xl h-12"
          >
            Usar senha padrão
          </Button>
        </motion.div>

      </div>
    </motion.div>
  );
}