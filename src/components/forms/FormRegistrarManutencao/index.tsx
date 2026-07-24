import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Wrench, ChevronRight, ChevronLeft, Check } from 'lucide-react';

import { Button } from '../../ui/Button';
import { ModalConfirmacaoFoto } from '../../ModalConfirmacaoFoto';
import { parseDecimal } from '../../../utils';
import { desformatarDinheiro } from '../../../lib/formatters';
import { useVeiculos } from '../../../hooks/useVeiculos';

import { manutencaoSchema } from './schema';
import type { PayloadOrdemServico } from './schema';
import type { z } from 'zod';

type FormInput = z.input<typeof manutencaoSchema>;
type FormOutput = z.output<typeof manutencaoSchema>;

import { Step1DadosGerais } from './Step1DadosGerais';
import { Step2ItensServicos } from './Step2ItensServicos';
import { Step3Confirmacao } from './Step3Confirmacao';
import { hapticError } from '../../../lib/haptics';

interface FormRegistrarManutencaoProps {
  onSuccess?: () => void;
  onClose?: () => void;
  veiculoIdPreSelecionado?: string;
  planoManutencaoId?: string;
}

export function FormRegistrarManutencao({ onSuccess, onClose, veiculoIdPreSelecionado, planoManutencaoId }: FormRegistrarManutencaoProps) {
  const [searchParams] = useSearchParams();
  const urlVeiculoId = searchParams.get('veiculoId') || undefined;
  const finalVeiculoId = veiculoIdPreSelecionado || urlVeiculoId;

  const [step, setStep] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<PayloadOrdemServico | null>(null);

  const { data: veiculos = [] } = useVeiculos();

  const methods = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      alvo: finalVeiculoId ? 'VEICULO' : 'VEICULO',
      veiculoId: finalVeiculoId || '',
      planoManutencaoId: planoManutencaoId || '',
      fornecedorId: '',
      kmAtual: '',
      tipo: planoManutencaoId ? 'PREVENTIVA' : 'CORRETIVA',
      data: new Date().toISOString().slice(0, 10),
      observacoes: '',
      itens: [{ produtoId: '', quantidade: 1, valorPorUnidade: '' }] 
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  });

  const { handleSubmit, trigger, reset, formState: { isSubmitting } } = methods;

  const nextStep = async () => {
    if (step === 1) {
      // Valida campos da etapa 1 individualmente
      // Usamos setError manual para marcar os campos com erro
      // e toast.error para garantir feedback visual imediato ao usuário
      const values = methods.getValues();
      const camposFaltando: string[] = [];

      // fornecedorId sempre obrigatório na etapa 1
      if (!values.fornecedorId) {
        methods.setError('fornecedorId', { type: 'manual', message: 'Selecione o fornecedor / oficina' }, { shouldFocus: true });
        camposFaltando.push('Oficina / Fornecedor');
      } else {
        methods.clearErrors('fornecedorId');
      }

      // data obrigatória
      if (!values.data) {
        methods.setError('data', { type: 'manual', message: 'Data é obrigatória' }, { shouldFocus: true });
        camposFaltando.push('Data do Serviço');
      } else {
        methods.clearErrors('data');
      }

      // Veículo obrigatório apenas se alvo === 'VEICULO'
      if (values.alvo === 'VEICULO' && !values.veiculoId) {
        methods.setError('veiculoId', { type: 'manual', message: 'Selecione o veículo' }, { shouldFocus: true });
        camposFaltando.push('Veículo');
      } else {
        methods.clearErrors('veiculoId');
      }

      // numeroCA obrigatório apenas se alvo === 'OUTROS'
      if (values.alvo === 'OUTROS' && !values.numeroCA) {
        methods.setError('numeroCA', { type: 'manual', message: 'Informe o nº do CA / Série' }, { shouldFocus: true });
        camposFaltando.push('Nº CA / Série');
      } else {
        methods.clearErrors('numeroCA');
      }

      if (camposFaltando.length > 0) {
        toast.error(`Preencha os campos obrigatórios: ${camposFaltando.join(', ')}`);
        hapticError();
      } else {
        setStep(s => s + 1);
      }
    } else if (step === 2) {
      // Na etapa 2, valida somente os itens
      const itens = methods.getValues('itens');
      let step2Valid = true;

      if (!itens || itens.length === 0) {
        toast.error('Adicione pelo menos um item de serviço / peça');
        step2Valid = false;
      } else {
        itens.forEach((item, idx) => {
          if (!item.produtoId) {
            methods.setError(`itens.${idx}.produtoId` as 'itens.0.produtoId', { type: 'manual', message: 'Selecione o serviço/peça' }, { shouldFocus: true });
            step2Valid = false;
          }
          if (!item.quantidade || Number(item.quantidade) < 0.01) {
            methods.setError(`itens.${idx}.quantidade` as 'itens.0.quantidade', { type: 'manual', message: 'Qtd inválida' }, { shouldFocus: true });
            step2Valid = false;
          }
          if (!item.valorPorUnidade) {
            methods.setError(`itens.${idx}.valorPorUnidade` as 'itens.0.valorPorUnidade', { type: 'manual', message: 'Valor inválido' }, { shouldFocus: true });
            step2Valid = false;
          }
        });
        if (!step2Valid) toast.error('Verifique os itens: produto, quantidade e valor são obrigatórios');
      }

      if (step2Valid) {
        setStep(s => s + 1);
      } else {
        hapticError();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (step < 3) {
      nextStep();
    } else {
      handleSubmit(onSubmit, () => hapticError())(e);
    }
  };

  const onSubmit = async (data: FormOutput) => {
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
      planoManutencaoId: data.planoManutencaoId || null,
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
    // ✨ CORREÇÃO 1: Removido o h-[85dvh]. Usamos h-full w-full para preencher o Modal sem brigar com ele.
    // O arredondamento do topo já é feito pelo Drawer do Vaul, então mantemos apenas a estrutura de coluna.
    <div className="flex flex-col h-full w-full bg-surface">
      
      {/* HEADER FIXO: shrink-0 garante que não seja esmagado */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b border-border/50 bg-surface-hover/30 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-header text-lg sm:text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Wrench className="w-5 h-5"/></div>
              Nova OS Manutenção
            </h3>
            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-widest mt-1">
              Etapa {step} de 3 {step === 1 ? '- Dados Iniciais' : step === 2 ? '- Itens e Serviços' : '- Revisão Final'}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out flex-1 sm:w-10 ${s <= step ? 'bg-primary' : 'bg-border/60'}`} />
            ))}
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0 relative">
          
          {/* A classe flex-1 faz essa div ocupar o espaço do meio, e o overflow-y-auto gera a barra de rolagem. */}
          <div data-vaul-no-drag className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 scrollbar-thin pb-[15vh] md:pb-6 relative scroll-smooth">
            {step === 1 && <Step1DadosGerais />}
            {step === 2 && <Step2ItensServicos />}
            {step === 3 && <Step3Confirmacao />}
          </div>

          {/* Substituí as alturas fixas pesadas pela lógica touch-target nativa. */}
          <div className="px-4 sm:px-8 py-3 sm:py-5 border-t border-border/60 bg-surface flex flex-col-reverse sm:flex-row gap-3 shrink-0 safe-bottom shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10">
            {step > 1 ? (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setStep(s => s - 1)} 
                className="w-full sm:flex-1 touch-target" 
                icon={<ChevronLeft className="w-5 h-5" />} 
                disabled={isSubmitting}
              >
                Voltar
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose} 
                className="w-full sm:flex-1 touch-target text-text-secondary hover:text-text-main" 
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}

            {step < 3 ? (
              <Button 
                type="submit" 
                className="w-full sm:flex-[2] touch-target font-black" 
                icon={<ChevronRight className="w-5 h-5" />} 
                disabled={isSubmitting}
              >
                Continuar
              </Button>
            ) : (
              <Button 
                type="submit" 
                isLoading={isSubmitting} 
                variant="success" 
                className="w-full sm:flex-[2] touch-target text-lg" 
                icon={<Check className="w-5 h-5" />}
              >
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
          nested={true}
          jornadaId={formDataParaModal.veiculoId} 
          onClose={() => setModalAberto(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
