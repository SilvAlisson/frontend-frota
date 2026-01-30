import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Flag, Gauge, Route, Ghost, CheckCircle2 } from 'lucide-react';

import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card'; // Importando o Card novo
import { parseDecimal, formatKmVisual, isJornadaFantasma } from '../utils';
import type { Jornada } from '../types';

interface JornadaCardProps {
  jornada: Jornada;
  onJornadaFinalizada: () => void;
}

export function JornadaCard({
  jornada,
  onJornadaFinalizada
}: JornadaCardProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [dadosValidacao, setDadosValidacao] = useState<{ kmFim: number } | null>(null);

  // --- Verificações de Estado ---
  const isFinalizada = !!jornada.dataFim;
  const isFantasma = isJornadaFantasma(jornada);
  const nomeEncarregado = jornada.encarregado?.nome || 'Não informado';

  // --- Schema de Validação (Zod) ---
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
        message: `Deve ser > ${jornada.kmInicio.toLocaleString('pt-BR')}`,
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
    defaultValues: { kmFimInput: '' },
    mode: 'onChange'
  });

  // --- Cálculos em Tempo Real ---
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

  // --- RENDERIZAÇÃO: JORNADA JÁ FINALIZADA ---
  if (isFinalizada) {
    return (
      <Card className={`p-8 flex flex-col items-center justify-center text-center transition-all ${
        isFantasma 
          ? 'bg-ghost-500/5 border-ghost-500/20' 
          : 'bg-success/5 border-success/20'
      }`}>
        <div className={`p-3 rounded-full mb-3 ${
          isFantasma 
            ? 'bg-ghost-500/10 text-ghost-500' 
            : 'bg-success/10 text-success'
        }`}>
          {isFantasma ? <Ghost className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <h3 className={`text-lg font-bold ${isFantasma ? 'text-ghost-500' : 'text-success'}`}>
          {isFantasma ? 'Jornada Assombrada' : 'Jornada Finalizada'}
        </h3>

        <p className="text-sm text-text-secondary mt-2 max-w-[250px]">
          {isFantasma
            ? 'Encerrada automaticamente pelo sistema por inatividade prolongada.'
            : `Encerrada com sucesso em ${new Date(jornada.dataFim!).toLocaleString('pt-BR')}`
          }
        </p>

        <Button
          variant="ghost"
          onClick={onJornadaFinalizada}
          className="mt-6 text-xs h-8 text-text-muted hover:text-text-main"
        >
          Voltar para lista
        </Button>
      </Card>
    );
  }

  // --- RENDERIZAÇÃO: FORMULÁRIO DE FINALIZAÇÃO ---
  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        {/* CABEÇALHO */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3 ring-4 ring-primary/5">
            <Flag className="w-7 h-7 text-primary ml-1" />
          </div>
          <h3 className="text-xl font-bold text-text-main">
            Finalizar Jornada
          </h3>
          <p className="text-sm text-text-secondary mt-1 px-4 leading-relaxed">
            Confirme o odômetro final para fechar o turno.
          </p>
        </div>

        {/* CARDS DE INFORMAÇÃO */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background p-3 rounded-xl border border-border text-center flex flex-col items-center justify-center">
            <span className="text-[10px] text-text-muted font-bold uppercase mb-1 flex items-center gap-1">
              <Gauge className="w-3 h-3" /> KM Inicial
            </span>
            <span className="text-sm font-bold text-text-main font-mono">
              {jornada.kmInicio.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-background p-3 rounded-xl border border-border text-center flex flex-col items-center justify-center">
            <span className="text-[10px] text-text-muted font-bold uppercase mb-1 flex items-center gap-1">
              <Route className="w-3 h-3" /> Percorrido
            </span>
            <span className={`text-sm font-bold font-mono ${distanciaPercorrida > 0 ? 'text-primary' : 'text-text-muted'}`}>
              {distanciaPercorrida > 0 ? `+ ${distanciaPercorrida.toLocaleString('pt-BR')} km` : '--'}
            </span>
          </div>
        </div>

        {/* INPUT DE KM */}
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
            className="text-lg font-bold tracking-wide font-mono"
            autoFocus
          />

          <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span>Responsável: <strong>{nomeEncarregado}</strong></span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3.5 text-base shadow-button hover:shadow-float"
          disabled={isSubmitting || !kmFimInput}
        >
          Confirmar Encerramento
        </Button>
      </form>

      {/* MODAL DE FOTO */}
      {modalAberto && dadosValidacao && (
        <ModalConfirmacaoFoto
          titulo="Comprovante Final"
          kmParaConfirmar={dadosValidacao.kmFim}
          jornadaId={jornada.id}
          apiEndpoint={`/jornadas/finalizar/${jornada.id}`}
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