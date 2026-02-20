// src/components/forms/FormRegistrarManutencao/index.tsx
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Wrench, ChevronRight, ChevronLeft, Check } from 'lucide-react';

import { Button } from '../../ui/Button';
import { ModalConfirmacaoFoto } from '../../ModalConfirmacaoFoto';
import { parseDecimal } from '../../../utils';
import { desformatarDinheiro } from '../../../lib/formatters';
import { useVeiculos } from '../../../hooks/useVeiculos';

// 🔥 CORREÇÃO: Importando tipos com a sintaxe 'type'
import { manutencaoSchema } from './schema';
import type { ManutencaoFormValues, PayloadOrdemServico } from './schema';

import { Step1DadosGerais } from './Step1DadosGerais';
import { Step2ItensServicos } from './Step2ItensServicos';
import { Step3Confirmacao } from './Step3Confirmacao';

interface FormRegistrarManutencaoProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function FormRegistrarManutencao({ onSuccess, onClose }: FormRegistrarManutencaoProps) {
  const [step, setStep] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<PayloadOrdemServico | null>(null);

  const { data: veiculos = [] } = useVeiculos();

  // O "methods" carrega todo o poder do React Hook Form
  const methods = useForm<ManutencaoFormValues>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      alvo: 'VEICULO',
      tipo: 'CORRETIVA',
      data: new Date().toISOString().slice(0, 10),
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: '' } as any] 
    },
    mode: 'onBlur'
  });

  const { handleSubmit, trigger, reset, formState: { isSubmitting } } = methods;

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await trigger(['alvo', 'veiculoId', 'fornecedorId', 'data', 'kmAtual', 'numeroCA', 'tipo']);
    else if (step === 2) isValid = await trigger('itens');
    
    if (isValid) setStep(s => s + 1);
  };

  const onSubmit = async (data: ManutencaoFormValues) => {
    let kmInputFloat = null;
    
    if (data.alvo === 'VEICULO' && data.kmAtual) {
      kmInputFloat = parseDecimal(data.kmAtual);
      const veiculo = veiculos.find(v => v.id === data.veiculoId);
      const ultimoKmRegistrado = veiculo?.ultimoKm || 0;
      
      if (kmInputFloat < ultimoKmRegistrado && ultimoKmRegistrado > 0) {
        toast.warning(`Nota: KM informado (${kmInputFloat}) é menor que o anterior (${ultimoKmRegistrado}).`);
      }
    }

    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    const payload: PayloadOrdemServico = {
      tipo: data.tipo,
      veiculoId: data.alvo === 'VEICULO' ? (data.veiculoId || null) : null,
      fornecedorId: data.fornecedorId,
      kmAtual: kmInputFloat,
      data: new Date(data.data + 'T12:00:00').toISOString(),
      observacoes: obsFinal,
      itens: data.itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: Number(item.quantidade),
        valorPorUnidade: desformatarDinheiro(String(item.valorPorUnidade)) 
      }))
    };

    setFormDataParaModal(payload);
    setModalAberto(true);
  };

  const handleSuccess = () => {
    toast.success('Ordem de Serviço registrada com sucesso!');
    setModalAberto(false);
    reset();
    setStep(1);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl overflow-hidden shadow-float">
      
      {/* HEADER PROGRESSO */}
      <div className="px-6 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border/50 bg-surface-hover/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Wrench className="w-5 h-5"/></div>
              Nova OS Manutenção
            </h3>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-2">Etapa {step} de 3</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all duration-500 ease-out flex-1 sm:w-10 ${s <= step ? 'bg-primary' : 'bg-border/60'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 MÁGICA: O FormProvider distribui o estado para todos os componentes filhos silenciosamente */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
            {step === 1 && <Step1DadosGerais />}
            {step === 2 && <Step2ItensServicos />}
            {step === 3 && <Step3Confirmacao />}
          </div>

          {/* FOOTER NAVEGAÇÃO */}
          <div className="px-6 sm:px-8 py-5 border-t border-border/60 bg-surface-hover/30 flex gap-4 shrink-0">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1" icon={<ChevronLeft className="w-5 h-5" />} disabled={isSubmitting}>
                Voltar
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-text-secondary hover:text-text-main" disabled={isSubmitting}>
                Cancelar
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep} className="flex-[2]" icon={<ChevronRight className="w-5 h-5" />} disabled={isSubmitting}>
                Continuar
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} variant="success" className="flex-[2] text-lg py-6" icon={<Check className="w-5 h-5" />}>
                Finalizar OS
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      {/* MODAL FINAL */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo={`Anexar NF da OS ${formDataParaModal.tipo}`}
          dadosJornada={formDataParaModal}
          apiEndpoint="/manutencoes"
          apiMethod="POST"
          kmParaConfirmar={null}
          // 🔥 CORREÇÃO: veiculoId já pode ser null pelo schema, então passamos direto!
          jornadaId={formDataParaModal.veiculoId} 
          onClose={() => setModalAberto(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}