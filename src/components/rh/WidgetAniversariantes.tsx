import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { PartyPopper, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CartazAniversario } from './CartazAniversario';
import { Skeleton } from '../ui/Skeleton';
import { Avatar } from '../ui/Avatar';

interface Aniversariante {
  id: string;
  nome: string;
  image: string | null;
  cargo: string | null;
  dataNascimento: string;
  dia: number;
  mes: number;
  diasParaAniversario: number;
}

export function WidgetAniversariantes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAniv, setSelectedAniv] = useState<Aniversariante | null>(null);

  const { data: aniversariantes = [], isLoading: loading, isError } = useQuery({
    queryKey: ['aniversariantes'],
    queryFn: async () => {
      const { data } = await api.get('/rh/aniversariantes');
      return data as Aniversariante[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora de cache, já que aniversários não mudam
  });

  if (isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-4 flex items-center justify-center">
        <p className="text-sm text-red-500 font-medium">Não foi possível carregar os aniversariantes.</p>
      </div>
    );
  }

  if (loading && aniversariantes.length === 0) {
    return <Skeleton variant="card" className="h-[120px]" />;
  }

  if (aniversariantes.length === 0) {
    return null; // Não mostra nada se não tiver aniversariante
  }

  return (
    <>
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-500/20 rounded-[2rem] p-5 sm:p-6 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 group">
        {/* Enfeite fundo */}
        <div className="absolute -top-10 -right-10 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          🎉
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/60 dark:bg-black/20 rounded-2xl shadow-sm backdrop-blur-md">
              <PartyPopper className="w-8 h-8 text-pink-600 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                Temos Aniversariantes! 🎂
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {aniversariantes.length} integrante(s) comemorando aniversário hoje ou nos próximos 7 dias.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {aniversariantes.slice(0, 3).map(aniv => (
              <div key={aniv.id} className="flex items-center gap-3 bg-white/60 dark:bg-black/20 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/50">
                <Avatar 
                  url={aniv.image}
                  nome={aniv.nome}
                  className="border-2 border-pink-200"
                />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-text-main line-clamp-1 max-w-[120px]">{aniv.nome.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-pink-600 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {aniv.diasParaAniversario === 0 ? 'HOJE!' : `Em ${aniv.diasParaAniversario} dias`}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="ml-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
                  onClick={() => {
                    setSelectedAniv(aniv);
                    setModalOpen(true);
                  }}
                >
                  Gerar Cartaz
                </Button>
              </div>
            ))}
            {aniversariantes.length > 3 && (
              <div className="flex items-center justify-center px-4 py-2 text-sm font-bold text-pink-700 bg-white/40 rounded-xl">
                +{aniversariantes.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title="Gerador de Cartaz de Aniversário"
      >
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl">
          <p className="text-sm text-text-secondary mb-6 text-center max-w-md">
            Gere o cartaz oficial da Klin, copie para a sua área de transferência e cole diretamente no WhatsApp!
          </p>
          
          {selectedAniv && (
            <CartazAniversario 
              nome={selectedAniv.nome} 
              fotoUrl={selectedAniv.image}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
