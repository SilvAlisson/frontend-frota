import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
// Importe o tipo Jornada global se possível, senão ajuste a interface local:
import type { Jornada } from '../types';

interface JornadaCardProps {
  // Usamos o tipo Jornada global aqui para garantir compatibilidade
  jornada: Jornada; // Alterei o nome da prop para ser mais genérico
  onJornadaFinalizada: () => void;
}

// O componente principal agora se chama JornadaCard, resolvendo o erro de importação.
export function JornadaCard({
  jornada, // Renomeado jornadaParaFinalizar para jornada para simplificar
  onJornadaFinalizada
}: JornadaCardProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [dadosValidacao, setDadosValidacao] = useState<{ kmFim: number } | null>(null);

  const finalizarSchema = z.object({
    kmFimInput: z.string({ error: "KM Final obrigatório" })
      .min(1, { message: "Informe o KM do painel" })
  }).superRefine((val, ctx) => {
    const kmFim = parseDecimal(val.kmFimInput);
    if (kmFim <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "KM inválido",
        path: ["kmFimInput"]
      });
      return;
    }
    if (kmFim < jornada.kmInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Deve ser maior que ${jornada.kmInicio.toLocaleString('pt-BR')}`,
        path: ["kmFimInput"]
      });
    }
  });

  type FinalizarFormValues = z.input<typeof finalizarSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FinalizarFormValues>({
    resolver: zodResolver(finalizarSchema),
    defaultValues: {
      kmFimInput: ''
    },
    mode: 'onChange'
  });

  const kmFimInput = watch('kmFimInput');
  const kmFimAtual = parseDecimal(kmFimInput);
  const distanciaPercorrida = kmFimAtual > jornada.kmInicio
    ? kmFimAtual - jornada.kmInicio
    : 0;

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmFimInput", formatKmVisual(e.target.value), { shouldValidate: true });
  };

  const onSubmit = (data: FinalizarFormValues) => {
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

  // Fallback seguro para nome do encarregado
  const nomeEncarregado = jornada.encarregado?.nome || 'Não informado';

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-primary">
            Finalizar Jornada
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Confirme o odômetro final para fechar o turno.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">KM Inicial</span>
            <span className="text-sm font-bold text-gray-700">
              {jornada.kmInicio.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Percorrido</span>
            <span className={`text-sm font-bold ${distanciaPercorrida > 0 ? 'text-primary' : 'text-gray-400'}`}>
              {distanciaPercorrida > 0 ? `+ ${distanciaPercorrida.toLocaleString('pt-BR')} km` : '--'}
            </span>
          </div>
        </div>

        <div className="relative">
          <Input
            label="KM Final (Painel)"
            id={`kmFim-${jornada.id}`}
            type="text"
            inputMode="numeric"
            placeholder={`> ${jornada.kmInicio}`}
            {...register('kmFimInput')}
            onChange={(e: any) => {
              register('kmFimInput').onChange(e);
              handleKmChange(e);
            }}
            error={errors.kmFimInput?.message}
            className="text-lg font-bold tracking-wide"
            autoFocus
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
        >
          Confirmar Encerramento
        </Button>
      </form>

      {modalAberto && dadosValidacao && (
        <ModalConfirmacaoFoto
          titulo="Comprovante Final"
          kmParaConfirmar={dadosValidacao.kmFim}
          jornadaId={jornada.id}
          apiEndpoint={`/jornadas/finalizar/:jornadaId`}
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