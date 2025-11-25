import { JornadaGestaoItem } from './JornadaGestaoItem';

interface GestaoJornadasProps {
  // Token removido
  jornadasAbertas: any[];
  onJornadaFinalizadaManualmente: (jornadaId: string) => void;
}

export function GestaoJornadas({
  jornadasAbertas,
  onJornadaFinalizadaManualmente
}: GestaoJornadasProps) {

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Monitoramento de Jornadas Ativas
      </h3>

      {jornadasAbertas.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Nenhuma jornada em aberto no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jornadasAbertas.map(jornada => (
            <JornadaGestaoItem
              key={jornada.id}
              // token prop removido, pois api.ts lida com isso
              token={localStorage.getItem('authToken') || ''}
              jornada={jornada}
              onFinalizada={onJornadaFinalizadaManualmente}
            />
          ))}
        </div>
      )}
    </div>
  );
}