import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Gauge, Route, Ghost, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';

import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
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

  const isFinalizada = !!jornada.dataFim;
  const isFantasma = isJornadaFantasma(jornada);
  const nomeEncarregado = jornada.encarregado?.nome || 'Não informado';

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

  if (isFinalizada) {
    return (
      <Card className={`p-8 flex flex-col items-center justify-center text-center transition-all ${
        isFantasma 
          ? 'bg-amber-500/5 border-amber-500/20' 
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div className={`p-4 rounded-full mb-4 shadow-inner ${
          isFantasma 
            ? 'bg-amber-500/10 text-amber-500' 
            : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isFantasma ? <Ghost className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <h3 className={`text-xl font-black tracking-tight ${isFantasma ? 'text-amber-600' : 'text-emerald-700'}`}>
          {isFantasma ? 'Jornada Assombrada' : 'Turno Encerrado'}
        </h3>

        <p className="text-sm text-text-secondary mt-2 max-w-[280px] font-medium leading-relaxed">
          {isFantasma
            ? 'Encerrada automaticamente pelo sistema por inatividade prolongada.'
            : `Encerrada com sucesso às ${new Date(jornada.dataFim!).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`
          }
        </p>

        <Button
          variant="ghost"
          onClick={onJornadaFinalizada}
          className="mt-6 text-sm h-10 px-6 font-bold text-text-muted hover:text-text-main"
        >
          Voltar ao Início
        </Button>
      </Card>
    );
  }

  // --- FORMULÁRIO "EM OPERAÇÃO" ---
  return (
    <>
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-surface p-5 sm:p-7 shadow-card relative overflow-hidden">
        {/* Marca d'água visual de operação */}
        <Navigation className="absolute -right-6 -bottom-6 w-40 h-40 text-emerald-500/5 -rotate-12 pointer-events-none" />

        <form className="space-y-6 relative z-10" onSubmit={handleSubmit(onSubmit)}>

          {/* Cabeçalho */}
          <div className="flex flex-col mb-2">
            <h3 className="text-2xl font-black text-text-main tracking-tight">
              Encerrar Jornada
            </h3>
            <p className="text-sm text-text-secondary font-medium mt-1">
              Registre o odômetro de chegada do veículo <strong className="text-text-main font-mono bg-surface px-1.5 py-0.5 rounded border border-border/60">{jornada.veiculo?.placa || 'N/A'}</strong>.
            </p>
          </div>

          {/* Cards de Informação */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface p-4 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-center">
              <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-primary" /> KM Inicial
              </span>
              <span className="text-xl font-black text-text-main font-mono tracking-tight">
                {jornada.kmInicio.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-center transition-all ${
              distanciaPercorrida > 0 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-sm' : 'bg-surface border-border/60'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${
                 distanciaPercorrida > 0 ? 'text-emerald-700' : 'text-text-muted'
              }`}>
                <Route className={`w-3.5 h-3.5 ${distanciaPercorrida > 0 ? 'text-emerald-600' : ''}`} /> Rodagem
              </span>
              <span className={`text-xl font-black font-mono tracking-tight ${
                 distanciaPercorrida > 0 ? 'text-emerald-600' : 'text-text-muted opacity-50'
              }`}>
                {distanciaPercorrida > 0 ? `+${distanciaPercorrida.toLocaleString('pt-BR')}` : '--'}
              </span>
            </div>
          </div>

          {/* Input Principal */}
          <div className="space-y-3 pt-2">
            <Input
              label="KM Final do Painel"
              id={`kmFim-${jornada.id}`}
              type="text"
              inputMode="numeric"
              placeholder={`Deve ser > ${jornada.kmInicio}`}
              {...register('kmFimInput')}
              onChange={(e: any) => {
                register('kmFimInput').onChange(e);
                handleKmChange(e);
              }}
              error={errors.kmFimInput?.message}
              className="text-2xl h-14 font-black tracking-widest font-mono text-center shadow-inner focus:ring-emerald-500/50"
              autoFocus
            />

            {/* Aviso de Auditoria (Substitui aquele item de "Responsável" simples) */}
            <div className="flex items-start gap-2.5 p-3.5 bg-surface-hover rounded-xl border border-border/60">
              <AlertTriangle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
              <div className="text-xs text-text-secondary leading-relaxed">
                Este encerramento será auditado por <strong className="text-text-main">{nomeEncarregado}</strong>. Prepare-se para tirar a foto do painel a seguir.
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 text-lg font-black shadow-button hover:shadow-float transition-all"
            disabled={isSubmitting || !kmFimInput}
          >
            Avançar para Foto
          </Button>
        </form>
      </Card>

      {/* Modal permanece inalterado em sua lógica */}
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