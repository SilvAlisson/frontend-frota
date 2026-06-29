import { MatrizQualificacao } from '../components/rh/MatrizQualificacao';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export function MatrizQualificacaoPage() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-24">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-3">
           <div className="p-1.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20">
              <ShieldCheck className="w-5 h-5" />
           </div>
           Matriz de Qualificação SSMA
        </h2>
        <p className="text-sm text-text-secondary">
          Visão completa cruzada de integrantes e requisitos legais/obrigatórios de saúde e segurança.
        </p>
      </div>

      <div className="bg-surface rounded-[2rem] border border-border/60 shadow-sm p-5 sm:p-6 lg:p-8">
        <Suspense fallback={
          <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-text-muted animate-pulse uppercase tracking-widest">Carregando Matriz...</p>
          </div>
        }>
          <MatrizQualificacao />
        </Suspense>
      </div>
    </div>
  );
}
