import { useState } from 'react';
import { ShieldCheck, Plus, Calendar } from 'lucide-react';
import { useProgramas } from '../hooks/useProgramas';
import { ModalNovaConvocacao } from '../components/rh/ModalNovaConvocacao';
import { Button } from '../components/ui/Button';

export function ConvocacoesPage() {
  const { data: programas, isLoading, refetch } = useProgramas();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-3">
             <div className="p-1.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20">
                <ShieldCheck className="w-5 h-5" />
             </div>
             Programas e Convocações SSMA
          </h2>
          <p className="text-sm text-text-secondary">
            Gerencie campanhas de saúde (PCMSO) e convoque colaboradores em lote.
          </p>
        </div>
        
        <Button 
          variant="primary" 
          className="shadow-button whitespace-nowrap"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Convocação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-text-muted">Carregando campanhas...</p>
        ) : (
          programas?.map(programa => (
            <div key={programa.id} className="bg-surface rounded-2xl border border-border/60 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-text-main leading-tight">{programa.nome}</h3>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                  {programa.tipo}
                </span>
              </div>
              
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {programa.descricao || 'Sem descrição.'}
              </p>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Lotes de Convocação</h4>
                {programa.convocacoes.length === 0 ? (
                  <p className="text-sm text-text-muted italic">Nenhuma convocação ativa.</p>
                ) : (
                  programa.convocacoes.map(conv => (
                    <div key={conv.id} className="bg-surface-hover rounded-xl p-3 border border-border/40">
                      <p className="text-sm font-bold text-text-main mb-1">{conv.titulo}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center text-text-secondary gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Prazo: {new Date(conv.dataLimite).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="font-medium text-primary">
                          {conv.usuarios.length} convocados
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}

        {programas?.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-muted">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma campanha ou programa de saúde criado ainda.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <ModalNovaConvocacao 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSuccess={() => {
            setModalOpen(false);
            refetch();
          }}
          programasExistentes={programas || []}
        />
      )}
    </div>
  );
}
