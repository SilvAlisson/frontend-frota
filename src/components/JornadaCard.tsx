import { useState, useEffect } from 'react';
import { FinalizarJornada } from './FinalizarJornadas'; 

// Tipos
interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  encarregado: { nome: string };
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
         <p className="text-gray-600"><strong>Veículo:</strong> {jornada.veiculo?.placa ?? 'N/A'}</p>
         <p className="text-gray-600"><strong>Início:</strong> {new Date(jornada.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
         <p className="text-gray-600"><strong>KM Inicial:</strong> {jornada.kmInicio}</p>
         {tempoDecorrido &&
            <p className="mt-3 text-lg font-medium bg-green-100 text-green-800 inline-block px-3 py-1 rounded">
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