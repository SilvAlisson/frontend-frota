// frontend/src/components/GestaoJornadas.tsx
// O novo painel do Encarregado (Prioridade 2)

import { JornadaGestaoItem } from './JornadaGestaoItem'; // Vamos criar este ficheiro a seguir

// Tipos
interface GestaoJornadasProps {
  token: string;
  jornadasAbertas: any[]; // A lista vinda do App.tsx
  onJornadaFinalizadaManualmente: (jornadaId: string) => void;
}

export function GestaoJornadas({ 
  token, 
  jornadasAbertas, 
  onJornadaFinalizadaManualmente 
}: GestaoJornadasProps) {

  return (
    <div className="space-y-4">
      {/* Verifica se a lista está vazia */}
      {jornadasAbertas.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          Nenhuma jornada em aberto encontrada.
        </p>
      )}

      {/* Faz o 'map' e renderiza um card para cada jornada aberta */}
      {jornadasAbertas.map(jornada => (
        <JornadaGestaoItem
          key={jornada.id}
          token={token}
          jornada={jornada}
          onFinalizada={onJornadaFinalizadaManualmente} // Passa o callback
        />
      ))}
    </div>
  );
}