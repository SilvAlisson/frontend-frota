import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Fuel, ChevronRight, ChevronLeft, Check } from 'lucide-react';

import { Button } from '../../ui/Button';
import { ModalConfirmacaoFoto } from '../../ModalConfirmacaoFoto';
import { ModalConfirmarAnomalia } from '../../ui/ModalConfirmarAnomalia';
import { parseKmInteligente } from '../../../utils';
import { desformatarDinheiro } from '../../../lib/formatters';
import { validarAbastecimento, temBloqueio, type AnomaliaAbastecimento } from '../../../utils/validateAbastecimento';
import { useVeiculos } from '../../../hooks/useVeiculos';
import type { User as UserType, Veiculo } from '../../../types';

import { abastecimentoSchema } from './schema';
import type { AbastecimentoPayload } from './schema';
import type { z } from 'zod';

type FormInput = z.input<typeof abastecimentoSchema>;
type FormOutput = z.output<typeof abastecimentoSchema>;

import { Step1DadosOperacionais } from './Step1DadosOperacionais';
import { Step2DadosFinanceiros } from './Step2DadosFinanceiros';
import { Step3Confirmacao } from './Step3Confirmacao';
import { hapticError, hapticSuccess } from '../../../lib/haptics';

interface FormRegistrarAbastecimentoProps {
  usuarioLogado?: UserType;
  veiculoPreSelecionadoId?: string;
  onSuccess?: () => void;
  onCancelar: () => void;
}

export function FormRegistrarAbastecimento({
  usuarioLogado,
  veiculoPreSelecionadoId,
  onCancelar,
  onSuccess
}: FormRegistrarAbastecimentoProps) {
  
  const [step, setStep] = useState(1);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [payload, setPayload] = useState<AbastecimentoPayload | null>(null);
  const [anomalias, setAnomalias] = useState<AnomaliaAbastecimento[]>([]);
  const [payloadPendente, setPayloadPendente] = useState<AbastecimentoPayload | null>(null);

  const { data: veiculos = [] } = useVeiculos();

  const methods = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      veiculoId: veiculoPreSelecionadoId ?? '',
      operadorId: (usuarioLogado?.role === 'OPERADOR' ? (usuarioLogado.id ?? '') : ''),
      fornecedorId: '',
      dataHora: new Date().toISOString().slice(0, 16),
      observacoes: '',
      itens: [{ produtoId: '', quantidade: '0', valorUnitario: '' }]
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const { handleSubmit, trigger, formState: { isSubmitting } } = methods;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (step === 1) {
      const isValid = await trigger(['veiculoId', 'operadorId', 'kmAtual', 'dataHora']);
      if (isValid) setStep(2);
      else hapticError();
    } else if (step === 2) {
      const fornecedorId = methods.getValues('fornecedorId');
      const itens = methods.getValues('itens');
      
      let step2Valid = true;
      if (!fornecedorId) {
        methods.setError('fornecedorId', { type: 'manual', message: 'Selecione o posto / fornecedor' });
        step2Valid = false;
      } else {
        methods.clearErrors('fornecedorId');
      }

      if (!itens || itens.length === 0) {
        toast.error('Adicione pelo menos um produto ao abastecimento');
        step2Valid = false;
      } else {
        itens.forEach((item, idx) => {
          if (!item.produtoId) {
            methods.setError(`itens.${idx}.produtoId`, { type: 'manual', message: 'Selecione o produto' });
            step2Valid = false;
          }
          if (!item.quantidade || Number(item.quantidade) <= 0) {
            methods.setError(`itens.${idx}.quantidade`, { type: 'manual', message: 'Quantidade inválida' });
            step2Valid = false;
          }
          if (!item.valorUnitario || desformatarDinheiro(String(item.valorUnitario)) <= 0) {
            methods.setError(`itens.${idx}.valorUnitario`, { type: 'manual', message: 'Valor unitário inválido' });
            step2Valid = false;
          }
        });
      }

      if (step2Valid) setStep(3);
      else hapticError();
    } else if (step === 3) {
      await handleSubmit(onSubmit, () => hapticError())(e);
    }
  };

  const onSubmit = async (data: FormOutput) => {
    const veiculo = veiculos.find((v: Veiculo) => v.id === data.veiculoId);
    const ultimoKm = veiculo?.ultimoKm || 0;
    const kmInputFloat = parseKmInteligente(data.kmAtual, ultimoKm);

    if (kmInputFloat < ultimoKm) {
      toast.warning(`Atenção: KM informado (${kmInputFloat.toLocaleString()}) é menor que o anterior (${ultimoKm.toLocaleString()}).`);
    }

    const payloadFinal: AbastecimentoPayload = {
      veiculoId:   data.veiculoId,
      operadorId:  data.operadorId,
      fornecedorId: data.fornecedorId,
      kmOdometro:  kmInputFloat,
      dataHora:    new Date(data.dataHora).toISOString(),
      observacoes: data.observacoes || undefined,
      itens: data.itens.map(i => {
        const qtd  = Number(i.quantidade);
        const unit = desformatarDinheiro(String(i.valorUnitario));
        const total = Number((qtd * unit).toFixed(2));
        return { produtoId: i.produtoId, quantidade: qtd, valorTotal: total, valorPorUnidade: unit };
      })
    };

    const custoTotal = payloadFinal.itens.reduce((acc, i) => acc + i.valorTotal, 0);
    const anomaliasDetectadas = validarAbastecimento(
      payloadFinal.itens.map(i => ({ quantidade: i.quantidade, valorPorUnidade: i.valorPorUnidade })),
      custoTotal
    );

    if (anomaliasDetectadas.length === 0) {
      setPayload(payloadFinal);
      setModalConfirmacao(true);
    } else {
      setPayloadPendente(payloadFinal);
      setAnomalias(anomaliasDetectadas);
    }
  };

  return (
    // 1. Uso de 85dvh no pai garante que o teclado não empurre o layout e cria o feeling de Bottom Sheet
    <div className="flex flex-col h-full w-full bg-surface rounded-t-2xl md:rounded-2xl shadow-float">

      {/* 2. HEADER FIXO - Densidade visual reduzida no mobile (px-4, py-4) */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b border-border/50 bg-surface-hover/30 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-header text-lg sm:text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Fuel className="w-5 h-5"/></div>
              Novo Abastecimento
            </h3>
            {/* Navegação Contextual Clara */}
            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-widest mt-1">
              Etapa {step} de 3 {step === 1 ? '- Operacional' : step === 2 ? '- Financeiro' : '- Revisão'}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out flex-1 sm:w-10 ${s <= step ? 'bg-primary' : 'bg-border/60'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0 relative">
          
          {/* 3. SCROLL APENAS ONDE PRECISA - Body ganha um pb-[15vh] para o último input não ficar escondido pelo teclado */}
          <div
          data-vaul-no-drag className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 scrollbar-thin pb-[15vh] md:pb-6 relative scroll-smooth">
            {step === 1 && <Step1DadosOperacionais />}
            {step === 2 && <Step2DadosFinanceiros />}
            {step === 3 && <Step3Confirmacao />}
          </div>

          {/* 4. FOOTER FIXO E EMPILHADO NO MOBILE */}
          <div className="px-4 sm:px-8 py-3 sm:py-5 border-t border-border/60 bg-surface flex flex-col-reverse sm:flex-row gap-3 shrink-0 safe-bottom shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(s => s - 1)}
                className="w-full sm:flex-1 h-12 sm:h-auto"
                icon={<ChevronLeft className="w-5 h-5" />}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancelar}
                className="w-full sm:flex-1 h-12 sm:h-auto"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="submit"
                className="w-full sm:flex-[2] h-14 sm:h-auto font-black"
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
                className="w-full sm:flex-[2] h-14 sm:h-auto text-lg"
                icon={<Check className="w-5 h-5" />}
              >
                Confirmar
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      {/* MODAIS: Por enquanto mantidos, mas a estrutura flex-col principal garantirá que o z-index e layout fiquem firmes */}
      <ModalConfirmarAnomalia
        anomalias={anomalias}
        custoTotalFormatado={
          payloadPendente
            ? payloadPendente.itens.reduce((a, i) => a + i.valorTotal, 0)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : 'R$ 0,00'
        }
        onConfirmar={() => {
          if (payloadPendente && !temBloqueio(anomalias)) {
            setPayload(payloadPendente);
            setPayloadPendente(null);
            setAnomalias([]);
            setModalConfirmacao(true);
          }
        }}
        onCorrigir={() => {
          setPayloadPendente(null);
          setAnomalias([]);
        }}
      />

      {modalConfirmacao && payload && (
        <ModalConfirmacaoFoto
          titulo="Comprovante e Finalização"
          dadosJornada={payload as unknown as Record<string, unknown>}
          kmParaConfirmar={payload.kmOdometro}
          jornadaId={payload.veiculoId}
          apiEndpoint="/abastecimentos"
          apiMethod="POST"
          nested={true}
          onClose={() => setModalConfirmacao(false)}
          onSuccess={() => {
            hapticSuccess();
            toast.success("Abastecimento e Nota Fiscal Registrados com sucesso!");
            onSuccess?.();
            onCancelar();
          }}
        />
      )}
    </div>
  );
}
