import { useState, useEffect } from 'react';
import { FinalizarJornada } from './FinalizarJornadas'; 

// Tipos
interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  encarregado: { nome: string };
  fotoInicioUrl: string | null;
}
interface JornadaCardProps {
  token: string;
  jornada: Jornada;
  onJornadaFinalizada: () => void;
}

// O Card
export function JornadaCard({ token, jornada, onJornadaFinalizada }: JornadaCardProps) {
  
  // --- Lógica do Timer (Movida do App.tsx para cá) ---
  const [tempoDecorrido, setTempoDecorrido] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: number | undefined;
    const inicio = new Date(jornada.dataInicio).getTime();

    const calcularTempo = () => {
      try {
          const agora = Date.now();
          const diffMs = agora - inicio;
          if (diffMs < 0) { setTempoDecorrido("00:00:00"); return; }
          const horas = Math.floor(diffMs / (1000 * 60 * 60));
          const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);
          setTempoDecorrido(
            `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
          );
      } catch (e) { setTempoDecorrido("--:--:--"); }
    };
    
    calcularTempo();
    intervalId = setInterval(calcularTempo, 1000);
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [jornada.dataInicio]); // Depende apenas da data de início desta jornada

  return (
    <div className="space-y-6">
      {/* 1. Card de Informações (Estilo Tailwind) */}
      <div className="bg-white shadow rounded-lg p-6 border-l-4 border-klin-azul">
         <h2 className="text-xl font-semibold text-gray-800 mb-3">Jornada em Andamento</h2>
         <div className="space-y-1">
           <p className="text-gray-600"><strong>Veículo:</strong> {jornada.veiculo?.placa ?? 'N/A'}</p>
           <p className="text-gray-600"><strong>Início:</strong> {new Date(jornada.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
           <p className="text-gray-600"><strong>KM Inicial:</strong> {jornada.kmInicio}</p>
           
           {/* <-- Adicionar o link da foto --> */}
           {jornada.fotoInicioUrl ? (
             <a
               href={jornada.fotoInicioUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="text-sm text-klin-azul hover:text-klin-azul-hover font-medium underline inline-flex items-center gap-1 pt-1"
             >
               Ver Foto de Início
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
               </svg>
             </a>
           ) : (
             <p className="text-sm text-gray-500 italic pt-1">
               (Sem foto de início)
             </p>
           )}
           {}
         </div>

         {tempoDecorrido &&
            <p className="mt-4 text-lg font-medium bg-green-100 text-green-800 inline-block px-3 py-1 rounded">
                <strong>Tempo Decorrido:</strong> {tempoDecorrido}
            </p>
         }
      </div>
       {/* 2. Formulário para finalizar (agora dentro de um card) */}
       <div className="bg-white shadow rounded-lg p-6">
         <FinalizarJornada
           token={token}
           jornadaParaFinalizar={jornada} // Passa o objeto desta jornada
           onJornadaFinalizada={onJornadaFinalizada} // Passa o callback
         />
       </div>
    </div>
  );
}