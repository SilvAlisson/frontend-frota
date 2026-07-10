import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useRadarSST } from '../../hooks/useRadarSST';
import type { RadarCard } from '../../hooks/useRadarSST';
import { AlertTriangle, Clock, CalendarCheck, ShieldAlert, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const COLUNAS = [
  { id: 'CRITICO', titulo: 'Crítico (Vencido / < 15 dias)', icone: <ShieldAlert className="w-5 h-5 text-error" />, corHeader: 'bg-error-soft border-error/30' },
  { id: 'ALERTA', titulo: 'Alerta (16 a 30 dias)', icone: <AlertTriangle className="w-5 h-5 text-warning" />, corHeader: 'bg-warning-soft border-warning/30' },
  { id: 'ATENCAO', titulo: 'Atenção (31 a 60 dias)', icone: <Clock className="w-5 h-5 text-info" />, corHeader: 'bg-info-soft border-info/30' },
  { id: 'AGENDADO', titulo: 'Agendado (Clínica)', icone: <CalendarCheck className="w-5 h-5 text-success" />, corHeader: 'bg-success-soft border-success/30' }
];

export function RadarSSMA() {
  const { cards, isLoading, agendarItem } = useRadarSST();
  const [board, setBoard] = useState<Record<string, RadarCard[]>>({
    CRITICO: [], ALERTA: [], ATENCAO: [], AGENDADO: []
  });

  useEffect(() => {
    if (cards) {
      setBoard({
        CRITICO: cards.filter(c => c.coluna === 'CRITICO'),
        ALERTA: cards.filter(c => c.coluna === 'ALERTA'),
        ATENCAO: cards.filter(c => c.coluna === 'ATENCAO'),
        AGENDADO: cards.filter(c => c.coluna === 'AGENDADO'),
      });
    }
  }, [cards]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    const sourceCards = Array.from(board[sourceColumnId]);
    const destCards = Array.from(board[destColumnId]);
    
    const [movedCard] = sourceCards.splice(source.index, 1);
    
    // Atualiza optimisticamente UI
    movedCard.coluna = destColumnId as 'CRITICO' | 'ALERTA' | 'ATENCAO' | 'AGENDADO';
    destCards.splice(destination.index, 0, movedCard);

    setBoard({
      ...board,
      [sourceColumnId]: sourceCards,
      [destColumnId]: destCards
    });

    // Se moveu PARA agendado ou DE agendado
    if (destColumnId === 'AGENDADO') {
      await agendarItem({ userId: movedCard.userId, tipo: movedCard.tipo, nomeExigencia: movedCard.nomeExigencia, status: 'AGENDADO' });
    } else if (sourceColumnId === 'AGENDADO') {
      // Remover agendamento 
      await agendarItem({ userId: movedCard.userId, tipo: movedCard.tipo, nomeExigencia: movedCard.nomeExigencia, status: 'REMOVIDO' }); // O status != AGENDADO fará ele recalcular a coluna base original depois do invalidate
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Carregando Radar SSMA...</div>;
  }

  return (
    <div className="w-full h-full overflow-x-auto pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-w-max h-full items-start">
          {COLUNAS.map(col => (
            <div key={col.id} className="w-80 flex flex-col h-full max-h-[800px]">
              {/* Header Coluna */}
              <div className={`flex items-center gap-2 p-3 rounded-t-lg border border-b-0 ${col.corHeader}`}>
                {col.icone}
                <h3 className="font-semibold text-text-main">{col.titulo}</h3>
                <span className="ml-auto text-xs bg-surface px-2 py-1 rounded-full text-text-main border border-border">{board[col.id]?.length || 0}</span>
              </div>

              {/* Corpo Coluna (Droppable) */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-2 bg-surface border border-border rounded-b-lg min-h-[150px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-surface-hover border-primary/50' : ''
                    }`}
                  >
                    {board[col.id]?.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 mb-3 bg-background border border-border rounded-lg shadow-sm ${
                              snapshot.isDragging ? 'shadow-lg border-primary/50 rotate-2' : 'hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {card.userImage ? (
                                <img src={card.userImage} alt={card.userName} className="w-8 h-8 rounded-full bg-surface" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
                                  <User className="w-4 h-4 text-text-muted" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-main truncate">{card.userName}</p>
                                <p className="text-xs text-text-secondary truncate">{card.cargo}</p>
                              </div>
                            </div>
                            
                            <div className="mt-2 p-2 bg-surface rounded flex justify-between items-center border border-border/50">
                              <div>
                                <span className="text-xs font-bold text-text-muted block mb-1">{card.tipo}</span>
                                <span className="text-sm text-text-main">{card.nomeExigencia}</span>
                              </div>
                            </div>

                            {card.validade && (
                              <div className="mt-2 flex justify-between items-center text-xs">
                                <span className="text-text-muted">
                                  Vence em: {format(new Date(card.validade), 'dd/MM/yyyy')}
                                </span>
                                <span className={`font-medium ${card.diasParaVencer < 0 ? 'text-error' : card.diasParaVencer <= 15 ? 'text-error' : card.diasParaVencer <= 30 ? 'text-warning' : 'text-info'}`}>
                                  {card.diasParaVencer < 0 ? 'Vencido' : `${card.diasParaVencer} dias`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
