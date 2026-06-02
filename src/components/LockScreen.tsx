import React from 'react';
import { Fingerprint } from 'lucide-react';
import { Button } from './ui/Button';

interface LockScreenProps {
  onUnlock: () => void;
  onUsePassword: () => void;
  isAuthenticating: boolean;
}

export function LockScreen({ onUnlock, onUsePassword, isAuthenticating }: LockScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden animate-in fade-in duration-500">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-90"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6">
        
        {/* Header */}
        <div className="text-center mb-12 animate-enter slide-in-from-bottom-4">
          <h1 className="text-4xl font-header font-black tracking-tighter text-white mb-2">FROTA <span className="text-primary">KLIN</span></h1>
          <p className="text-zinc-400 font-medium">Bem-vindo(a) de volta</p>
        </div>

        {/* Botão de Digital Gigante */}
        <button
          type="button"
          onClick={onUnlock}
          disabled={isAuthenticating}
          className="relative group flex items-center justify-center mb-8 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 rounded-full"
          aria-label="Tocar para desbloquear com biometria"
        >
          {/* Anéis de Pulso */}
          <div className="absolute inset-0 bg-primary/20 rounded-full scale-[1.5] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transition-all duration-500 ${isAuthenticating ? 'scale-95 border-primary/50 bg-primary/10' : 'group-hover:scale-105 group-hover:bg-white/10 group-active:scale-95'}`}>
            
            {/* Efeito Scanning quando autenticando */}
            {isAuthenticating && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30"></div>
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent to-primary/20 rounded-t-full animate-[scan_1.5s_ease-in-out_infinite_alternate]"></div>
              </>
            )}

            <Fingerprint 
              className={`w-14 h-14 transition-colors duration-300 ${
                isAuthenticating ? 'text-primary' : 'text-white/80 group-hover:text-white'
              }`} 
              strokeWidth={1.2}
            />
          </div>
        </button>

        <p className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 mb-16 ${
          isAuthenticating ? 'text-primary animate-pulse' : 'text-zinc-500'
        }`}>
          {isAuthenticating ? 'Verificando...' : 'Toque para acessar'}
        </p>

        {/* Rodapé: Usar Senha Padrão */}
        <div className="mt-auto animate-enter slide-in-from-bottom-4 delay-200">
          <Button
            variant="ghost"
            onClick={onUsePassword}
            className="text-zinc-400 hover:text-white hover:bg-white/5 tracking-widest uppercase text-xs font-bold rounded-xl"
          >
            Usar senha padrão
          </Button>
        </div>

      </div>
    </div>
  );
}
