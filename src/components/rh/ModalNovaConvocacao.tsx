import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useUsuarios } from '../../hooks/useUsuarios';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import type { ProgramaMacro } from '../../hooks/useProgramas';

interface ModalNovaConvocacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  programasExistentes: ProgramaMacro[];
}

export function ModalNovaConvocacao({ isOpen, onClose, onSuccess, programasExistentes }: ModalNovaConvocacaoProps) {
  const { usuarios = [], isLoading: loadingUsuarios } = useUsuarios();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [titulo, setTitulo] = useState('');
  const [programaId, setProgramaId] = useState('');
  const [dataLimite, setDataLimite] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [novoProgramaNome, setNovoProgramaNome] = useState('');
  const [novoProgramaTipo, setNovoProgramaTipo] = useState('PCMSO');

  const operadores = usuarios?.filter(u => u.status === 'ATIVO') || [];

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedUsers.length === operadores.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(operadores.map(o => o.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!titulo || (!programaId && !novoProgramaNome) || !dataLimite) {
        toast.warning('Preencha os campos obrigatórios.');
        return;
      }
      setStep(2);
      return;
    }

    if (selectedUsers.length === 0) {
      toast.warning('Selecione pelo menos um colaborador para convocar.');
      return;
    }

    setLoading(true);
    try {
      let finalProgramaId = programaId;
      
      // Se for criar um novo programa na hora
      if (programaId === 'NOVO') {
        const progRes = await api.post('/rh/programas', {
          nome: novoProgramaNome,
          tipo: novoProgramaTipo
        });
        finalProgramaId = progRes.data.id;
      }

      await api.post('/rh/convocacoes', {
        titulo,
        programaId: finalProgramaId,
        dataLimite,
        userIds: selectedUsers
      });

      toast.success('Convocação disparada com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Erro ao criar convocação.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Convocação em Lote" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {step === 1 ? (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h3 className="text-lg font-bold text-text-main mb-4 border-b border-border/40 pb-2">
              Passo 1: Detalhes da Campanha
            </h3>
            
            <Input
              label="Título da Convocação"
              placeholder="Ex: Exames Periódicos Out/2026"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
            />

            <Select
              label="Programa/Macro Campanha"
              value={programaId}
              onChange={e => setProgramaId(e.target.value)}
              options={[
                { value: '', label: 'Selecione ou crie um novo...' },
                ...programasExistentes.map(p => ({ value: p.id, label: p.nome })),
                { value: 'NOVO', label: '+ Criar Novo Programa' }
              ]}
              required
            />

            {programaId === 'NOVO' && (
              <div className="grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20 animate-in fade-in">
                <Input
                  label="Nome do Novo Programa"
                  placeholder="Ex: PCMSO 2026"
                  value={novoProgramaNome}
                  onChange={e => setNovoProgramaNome(e.target.value)}
                  required
                />
                <Select
                  label="Tipo"
                  value={novoProgramaTipo}
                  onChange={e => setNovoProgramaTipo(e.target.value)}
                  options={[
                    { value: 'PCMSO', label: 'PCMSO' },
                    { value: 'PGR', label: 'PGR' },
                    { value: 'TREINAMENTO', label: 'Treinamento/NR' },
                    { value: 'OUTRO', label: 'Outros' },
                  ]}
                />
              </div>
            )}

            <Input
              label="Prazo Limite para Realização"
              type="date"
              value={dataLimite}
              onChange={e => setDataLimite(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-end border-b border-border/40 pb-2 mb-4">
              <h3 className="text-lg font-bold text-text-main">
                Passo 2: Selecionar Integrantes
              </h3>
              <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {selectedUsers.length} selecionados
              </span>
            </div>

            {loadingUsuarios ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border border-border/60 rounded-xl overflow-hidden flex flex-col max-h-[40vh]">
                <div className="bg-surface-hover p-3 border-b border-border/60 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                      checked={selectedUsers.length === operadores.length && operadores.length > 0}
                      onChange={toggleAll}
                    />
                    <span className="text-sm font-bold text-text-main">Selecionar Todos</span>
                  </div>
                  <Users className="w-4 h-4 text-text-muted" />
                </div>
                
                <div className="overflow-y-auto p-2 space-y-1">
                  {operadores.map(op => (
                    <label key={op.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                        checked={selectedUsers.includes(op.id)}
                        onChange={() => toggleUser(op.id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main leading-tight">{op.nome}</span>
                        <span className="text-xs text-text-muted">{op.role}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border/40 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => step === 2 ? setStep(1) : onClose()}
            className="flex-1"
            disabled={loading}
          >
            {step === 2 ? 'Voltar' : 'Cancelar'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={loading}
          >
            {step === 1 ? 'Avançar' : 'Disparar Convocação'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
