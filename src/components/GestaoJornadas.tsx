import { useState } from 'react';
import { JornadaGestaoItem } from './JornadaGestaoItem';
import { toast } from 'sonner';
import { FormEditarJornada } from './forms/FormEditarJornada'; // 1. Import do Formulário

interface GestaoJornadasProps {
  jornadasAbertas: any[];
  onJornadaFinalizadaManualmente: (jornadaId: string) => void;
}

export function GestaoJornadas({
  jornadasAbertas,
  onJornadaFinalizadaManualmente
}: GestaoJornadasProps) {
  
  // 2. Estado para controlar qual jornada está sendo editada
  const [jornadaEditandoId, setJornadaEditandoId] = useState<string | null>(null);

  // Wrapper para adicionar feedback extra se necessário
  const handleFinalizar = (id: string) => {
    toast.success("Jornada processada.");
    onJornadaFinalizadaManualmente(id);
  };

  // 3. ATUALIZADO: Abre o modal definindo o ID
  const handleEditar = (jornada: any) => {
    setJornadaEditandoId(jornada.id);
  };

  // 4. NOVO: Recarrega a página ao salvar com sucesso para atualizar dados
  const handleSuccessEdit = () => {
    setJornadaEditandoId(null);
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* CABEÇALHO COM CONTADOR */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Monitoramento em Tempo Real
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie os veículos que estão em circulação agora.
          </p>
        </div>

        {jornadasAbertas.length > 0 && (
          <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
            {jornadasAbertas.length} Ativas
          </span>
        )}
      </div>

      {/* LISTA OU EMPTY STATE */}
      {jornadasAbertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-border text-center">
          <div className="p-4 bg-primary/5 rounded-full mb-4 ring-8 ring-primary/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900">Nenhum veículo em rota</h4>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">
            Todas as jornadas foram finalizadas ou ainda não foram iniciadas hoje.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jornadasAbertas.map(jornada => (
            <JornadaGestaoItem
              key={jornada.id}
              jornada={jornada}
              token=""
              onFinalizada={handleFinalizar}
              onExcluida={handleFinalizar}
              onEditar={handleEditar}
            />
          ))}
        </div>
      )}

      {/* 5. MODAL DE EDIÇÃO */}
      {jornadaEditandoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            {/* Container sem estilo extra para não conflitar com o card do formulário */}
            <div className="w-full max-w-2xl animate-in zoom-in-95">
                <FormEditarJornada 
                    jornadaId={jornadaEditandoId}
                    onSuccess={handleSuccessEdit}
                    onCancelar={() => setJornadaEditandoId(null)}
                />
            </div>
        </div>
       )}
    </div>
  );
}