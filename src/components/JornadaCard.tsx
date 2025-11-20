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

export function JornadaCard({ token, jornada, onJornadaFinalizada }: JornadaCardProps) {
  
  // Estado para o cronômetro
  const [tempoDecorrido, setTempoDecorrido] = useState<string>("--:--:--");

  useEffect(() => {
    const inicio = new Date(jornada.dataInicio).getTime();

    const calcularTempo = () => {
      const agora = Date.now();
      const diffMs = agora - inicio;
      
      if (diffMs < 0) { 
        setTempoDecorrido("00:00:00"); 
        return; 
      }

      const horas = Math.floor(diffMs / (1000 * 60 * 60));
      const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTempoDecorrido(
        `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
      );
    };
    
    // Atualiza imediatamente e depois a cada segundo
    calcularTempo();
    const intervalId = setInterval(calcularTempo, 1000);

    return () => clearInterval(intervalId);
  }, [jornada.dataInicio]);

  return (
    <div className="space-y-6">
      {/* Card de Informações */}
      <div className="bg-white shadow rounded-lg p-6 border-l-4 border-klin-azul">
         <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Jornada em Andamento</h2>
                <p className="text-sm text-gray-500 mb-4">Iniciada em: {new Date(jornada.dataInicio).toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-mono font-bold text-lg">
                {tempoDecorrido}
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Veículo</p>
                <p className="text-gray-800 font-medium">{jornada.veiculo?.placa} - {jornada.veiculo?.modelo}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">KM Inicial</p>
                <p className="text-gray-800 font-medium">{jornada.kmInicio} KM</p>
            </div>
         </div>

         {/* Link da Foto */}
         {jornada.fotoInicioUrl && (
            <div className="mt-2">
                <a
                    href={jornada.fotoInicioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-klin-azul hover:text-klin-azul-hover font-medium underline inline-flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    Ver Foto do Painel
                </a>
            </div>
         )}
      </div>

       {/* Formulário para finalizar (Componente separado) */}
       <div className="bg-white shadow rounded-lg p-6">
         <FinalizarJornada
           token={token}
           jornadaParaFinalizar={jornada} 
           onJornadaFinalizada={onJornadaFinalizada} 
         />
       </div>
    </div>
  );
}