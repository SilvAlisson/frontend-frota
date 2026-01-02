import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
import type { Jornada } from '../types';

interface FinalizarJornadaProps {
  jornadaParaFinalizar: Jornada;
  onJornadaFinalizada: () => void;
}

export function FinalizarJornada({
  jornadaParaFinalizar,
  onJornadaFinalizada
}: FinalizarJornadaProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [dadosValidacao, setDadosValidacao] = useState<{ kmFim: number } | null>(null);

  // --- SCHEMA ZOD ---
  const finalizarSchema = z.object({
    kmFimInput: z.string({ error: "KM Final obrigatório" })
      .min(1, { message: "Informe o KM do painel" })
  }).superRefine((val, ctx) => {
    const kmFim = parseDecimal(val.kmFimInput);

    if (kmFim <= 0) {
      ctx.addIssue({
        code: "custom", // [CORREÇÃO] String literal ao invés de ZodIssueCode
        message: "KM inválido",
        path: ["kmFimInput"]
      });
      return;
    }

    if (kmFim < jornadaParaFinalizar.kmInicio) {
      ctx.addIssue({
        code: "custom", // [CORREÇÃO] String literal ao invés de ZodIssueCode
        message: `Deve ser maior que ${jornadaParaFinalizar.kmInicio.toLocaleString('pt-BR')}`,
        path: ["kmFimInput"]
      });
    }
  });

  type FinalizarFormInput = z.input<typeof finalizarSchema>;
  type FinalizarFormOutput = z.output<typeof finalizarSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FinalizarFormInput, any, FinalizarFormOutput>({
    resolver: zodResolver(finalizarSchema),
    defaultValues: {
      kmFimInput: ''
    },
    mode: 'onChange'
  });

  // --- CÁLCULOS VISUAIS ---
  const kmFimInput = watch('kmFimInput');
  const kmFimAtual = parseDecimal(kmFimInput);
  const distanciaPercorrida = kmFimAtual > jornadaParaFinalizar.kmInicio
    ? kmFimAtual - jornadaParaFinalizar.kmInicio
    : 0;

  // Fallback seguro
  const nomeEncarregado = jornadaParaFinalizar.encarregado?.nome || 'Sistema/Admin';

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmFimInput", formatKmVisual(e.target.value), { shouldValidate: true });
  };

  const onSubmit = (data: FinalizarFormOutput) => {
    const kmFimFloat = parseDecimal(data.kmFimInput);
    setDadosValidacao({ kmFim: kmFimFloat });
    setModalAberto(true);
  };

  const handleModalSuccess = () => {
    toast.success("Jornada finalizada com sucesso!");
    onJornadaFinalizada();
    reset();
    setModalAberto(false);
  };

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-primary">
            Finalizar Jornada
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Confirme o odômetro final para fechar o turno.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background p-3 rounded-lg border border-border text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">KM Inicial</span>
            <span className="text-sm font-bold text-gray-700">
              {jornadaParaFinalizar.kmInicio.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-background p-3 rounded-lg border border-border text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Percorrido</span>
            <span className={`text-sm font-bold ${distanciaPercorrida > 0 ? 'text-primary' : 'text-gray-400'}`}>
              {distanciaPercorrida > 0 ? `+ ${distanciaPercorrida.toLocaleString('pt-BR')} km` : '--'}
            </span>
          </div>
        </div>

        <div className="relative">
          <Input
            label="KM Final (Painel)"
            id={`kmFim-${jornadaParaFinalizar.id}`}
            type="text"
            inputMode="numeric"
            placeholder={`> ${jornadaParaFinalizar.kmInicio}`}
            {...register('kmFimInput')}
            onChange={(e: any) => {
              register('kmFimInput').onChange(e);
              handleKmChange(e);
            }}
            error={errors.kmFimInput?.message}
            className="text-lg font-bold tracking-wide"
            autoFocus
            disabled={isSubmitting}
          />

          <div className="mt-2 flex justify-between items-center text-xs text-gray-400 px-1">
            <span>Encarregado: <strong>{nomeEncarregado}</strong></span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          disabled={isSubmitting || !kmFimInput}
          isLoading={isSubmitting}
        >
          Confirmar Encerramento
        </Button>
      </form>

      {modalAberto && dadosValidacao && (
        <ModalConfirmacaoFoto
          titulo="Comprovante Final"
          kmParaConfirmar={dadosValidacao.kmFim}
          jornadaId={jornadaParaFinalizar.id}
          apiEndpoint={`/jornadas/finalizar/${jornadaParaFinalizar.id}`}
          apiMethod="PUT"
          dadosJornada={{
            kmFim: dadosValidacao.kmFim,
          }}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}