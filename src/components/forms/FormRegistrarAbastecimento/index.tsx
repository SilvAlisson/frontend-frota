// src/components/forms/FormRegistrarAbastecimento/index.tsx
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
import type { AbastecimentoFormValues, AbastecimentoPayload } from './schema';

import { Step1DadosOperacionais } from './Step1DadosOperacionais';
import { Step2DadosFinanceiros } from './Step2DadosFinanceiros';
import { Step3Confirmacao } from './Step3Confirmacao';

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
  // ✨ Estado de validação de anomalias
  const [anomalias, setAnomalias] = useState<AnomaliaAbastecimento[]>([]);
  const [payloadPendente, setPayloadPendente] = useState<AbastecimentoPayload | null>(null);

  const { data: veiculos = [] } = useVeiculos();

  // O "methods" carrega todo o poder do React Hook Form
  const methods = useForm<AbastecimentoFormValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      veiculoId: veiculoPreSelecionadoId ?? '',
      operadorId: (usuarioLogado?.role === 'OPERADOR' ? (usuarioLogado.id ?? '') : ''),
      fornecedorId: '',
      dataHora: new Date().toISOString().slice(0, 16),
      itens: [{ produtoId: '', quantidade: 0, valorUnitario: '' } as any]
    },
    mode: 'onBlur',
    reValidateMode: 'onChange', // 🐛 FIX: evita ghosting de erros de validação
  });

  const { handleSubmit, trigger, formState: { isSubmitting } } = methods;

  const nextStep = async () => {
    const fieldsByStep: Record<number, (keyof AbastecimentoFormValues)[]> = {
      1: ['veiculoId', 'operadorId', 'kmAtual', 'dataHora'],
      2: ['fornecedorId', 'itens']
    };
    const isValid = await trigger(fieldsByStep[step]);
    if (isValid) setStep(s => s + 1);
  };

  const onSubmit = async (data: AbastecimentoFormValues) => {
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
      itens: data.itens.map(i => {
        const qtd  = Number(i.quantidade);
        const unit = desformatarDinheiro(String(i.valorUnitario));
        const total = Number((qtd * unit).toFixed(2));
        return { produtoId: i.produtoId, quantidade: qtd, valorTotal: total, valorPorUnidade: unit };
      })
    };

    // ✨ Verifica anomalias antes de avançar
    const custoTotal = payloadFinal.itens.reduce((acc, i) => acc + i.valorTotal, 0);
    const anomaliasDetectadas = validarAbastecimento(
      payloadFinal.itens.map(i => ({ quantidade: i.quantidade, valorPorUnidade: i.valorPorUnidade })),
      custoTotal
    );

    if (anomaliasDetectadas.length === 0) {
      // Sem anomalias: segue fluxo normal
      setPayload(payloadFinal);
      setModalConfirmacao(true);
    } else {
      // Com anomalias: guarda payload e abre modal de confirmação
      setPayloadPendente(payloadFinal);
      setAnomalias(anomaliasDetectadas);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl overflow-hidden shadow-float">

      {/* HEADER PROGRESSO */}
      <div className="px-6 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border/50 bg-surface-hover/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Fuel className="w-5 h-5"/></div>
              Novo Abastecimento
            </h3>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-2">Etapa {step} de 3</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-500 ease-out flex-1 sm:w-10 ${s <= step ? 'bg-primary' : 'bg-border/60'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* ðŸ”¥ MÁGICA DO PROVIDER */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
            {step === 1 && <Step1DadosOperacionais />}
            {step === 2 && <Step2DadosFinanceiros />}
            {step === 3 && <Step3Confirmacao />}
          </div>

          {/* FOOTER NAVEGAÇÃO */}
          <div className="px-6 sm:px-8 py-5 border-t border-border/60 bg-surface-hover/30 flex gap-4 shrink-0">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(s => s - 1)}
                className="flex-1"
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
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex-[2]"
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
                className="flex-[2] text-lg py-6"
                icon={<Check className="w-5 h-5" />}
              >
                Confirmar
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      {/* ✨ MODAL DE ANOMALIA DE VALOR */}
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

      {/* MODAL DE FOTO (Acesso de Câmera) */}
      {/* 🔒 007 FIX: nested={true} → Vaul trata corretamente drawer-dentro-drawer no mobile
          No desktop o Modal já usa createPortal para document.body, evitando overlay aninhado */}
      {modalConfirmacao && payload && (
        <ModalConfirmacaoFoto
          titulo="Comprovante e Finalização"
          dadosJornada={payload}
          kmParaConfirmar={payload.kmOdometro}
          jornadaId={payload.veiculoId}
          apiEndpoint="/abastecimentos"
          apiMethod="POST"
          nested={true}
          onClose={() => setModalConfirmacao(false)}
          onSuccess={() => {
            toast.success("Abastecimento e Nota Fiscal Registrados com sucesso!");
            onSuccess?.();
            onCancelar();
          }}
        />
      )}
    </div>
  );
}


