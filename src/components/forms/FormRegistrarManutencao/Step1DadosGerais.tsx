import { useEffect, useMemo, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Wrench, Truck, Gauge, AlertTriangle } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Callout } from '../../ui/Callout';
import { DatePicker } from '../../ui/DatePicker';
import { formatKmVisual } from '../../../utils';
import { useVeiculos } from '../../../hooks/useVeiculos';
import { useFornecedores } from '../../../hooks/useFornecedores';
import type { ManutencaoFormValues } from './schema';

export function Step1DadosGerais() {
  const { register, watch, setValue, control, formState: { errors, isSubmitting } } = useFormContext<ManutencaoFormValues>();

  const { data: veiculos = [], isLoading: loadV } = useVeiculos();
  const { fornecedores = [], isLoading: loadF } = useFornecedores();

  const isLocked = isSubmitting || loadV || loadF;
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  const alvoSelecionado = watch('alvo');
  const tipoManutencao = watch('tipo');
  const veiculoIdSelecionado = watch('veiculoId');
  const kmAtualVisual = watch('kmAtual');

  const kmAtualNum = Number(kmAtualVisual?.replace(/\D/g, '')) || 0;
  const isKmInvalido = ultimoKmRegistrado > 0 && kmAtualNum > 0 && kmAtualNum < ultimoKmRegistrado;

  // 🔥 SOLUÇÃO DEFINITIVA DO FILTRO 🔥
  const fornecedoresOpcoes = useMemo(() => {
    // Garantimos uma leitura booleana exata do watch atual
    const isPreventiva = tipoManutencao === 'PREVENTIVA';

    return fornecedores.filter(f => {
      // 1. NORMALIZAÇÃO: Pegamos o tipo do banco, transformamos em maiúsculo e trocamos espaços por underline.
      // Ex: "Lava Jato" -> "LAVA_JATO" | "lavajato" -> "LAVA_JATO" (com o replace extra)
      let tipoNormalizado = String(f.tipo || '').toUpperCase().trim();
      tipoNormalizado = tipoNormalizado.replace(/\s+/g, '_');

      // 2. CORREÇÃO "OUTROS": Adicionado "OUTROS" (plural) para bater com a interface do veiculo.ts
      if (['OFICINA', 'MECANICA', 'OUTRO', 'OUTROS'].includes(tipoNormalizado)) {
        return true; // Oficinas mecânicas sempre aparecem
      }

      // 3. AMPLIAÇÃO DO LAVA JATO: Cobrimos todas as variações possíveis de digitação no banco
      if (['LAVA_JATO', 'LAVAJATO', 'LAVAGEM', 'POSTO'].includes(tipoNormalizado)) {
        return isPreventiva; // Só aparece se clicou em PREVENTIVA
      }

      return false;
    }).map(f => ({ value: f.id, label: f.nome }));
  }, [fornecedores, tipoManutencao]); // Recalcula sempre que a lista de fornecedores ou o clique mudar

  const veiculosOpcoes = useMemo(() =>
    veiculos
      .filter(v => v.status !== 'INATIVO')
      .map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
    [veiculos]
  );

  useEffect(() => {
    if (alvoSelecionado !== 'VEICULO' || !veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }
    const veiculo = veiculos.find(v => v.id === veiculoIdSelecionado);
    setUltimoKmRegistrado(veiculo?.ultimoKm || 0);
  }, [veiculoIdSelecionado, alvoSelecionado, veiculos]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-2">

      {/* SEÇÃO 1: NATUREZA DO SERVIÇO */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
        <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Natureza do Serviço</label>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-surface-hover/80 p-1.5 rounded-[1rem] border border-border/60 shadow-inner">
        <Controller
          control={control}
          name="tipo"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <>
              {['CORRETIVA', 'PREVENTIVA'].map((t) => (
                <button
                  key={t}
                  type="button"
                  // Preserva a funcionalidade de "auto-focus" do RHF no primeiro botão se houver erro
                  ref={t === 'CORRETIVA' ? ref : null}
                  
                  onClick={() => {
                    // 1. Atualiza o field interno para o botão mudar de cor imediatamente
                    onChange(t);
                    
                    // 2. FORÇA a atualização do estado global para o watch() não sofrer delay
                    setValue('tipo', t as "CORRETIVA" | "PREVENTIVA", { shouldValidate: true, shouldDirty: true });
                    
                    // 3. Limpa a oficina selecionada (sem setTimeout para evitar bugs de ciclo de render)
                    if (value !== t) {
                      setValue('fornecedorId', '', { shouldValidate: true });
                    }
                  }}
                  
                  onBlur={onBlur}
                  disabled={isLocked}
                  className={`
                    py-3 text-xs font-black tracking-widest uppercase rounded-xl transition-all duration-300 truncate min-w-0
                    ${value === t
                      ? (t === 'CORRETIVA' ? 'bg-error text-white shadow-md' : 'bg-success text-white shadow-md')
                      : 'text-text-muted hover:text-text-main hover:bg-surface/80'}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {t}
                </button>
              ))}
            </>
          )}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {['VEICULO', 'OUTROS'].map(alvo => (
          <label key={alvo} className={`flex items-center gap-3 cursor-pointer p-3.5 border rounded-2xl w-full transition-all duration-200 select-none min-w-0 ${alvoSelecionado === alvo ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-surface-hover/50 hover:border-primary/30'}`}>
            <input
              type="radio"
              value={alvo}
              {...register('alvo')}
              disabled={isLocked}
              className="accent-primary w-4 h-4 cursor-pointer shrink-0"
            />
            <span className="text-sm font-black text-text-main tracking-wide truncate">
              {alvo === 'VEICULO' ? 'Veículo da Frota' : 'Equipamento Externo'}
            </span>
          </label>
        ))}
      </div>

      {/* SEÇÃO 2: IDENTIFICAÇÃO DO ATIVO */}
      <div className="flex items-center gap-2 mt-4 border-b border-border/50 pb-2">
        <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
        <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Identificação do Ativo</label>
      </div>

      {alvoSelecionado === 'VEICULO' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="min-w-0">
            <Controller
              control={control}
              name="veiculoId"
              render={({ field }) => (
                <Select
                  label="Veículo"
                  options={veiculosOpcoes}
                  icon={<Truck className="w-4 h-4" />}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.veiculoId?.message}
                  disabled={isLocked}
                />
              )}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <Input
              label="KM na entrada da oficina (Opcional)"
              icon={<Gauge className="w-4 h-4 text-primary" />}
              type="tel"
              inputMode="numeric"
              {...register("kmAtual")}
              onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
              placeholder={ultimoKmRegistrado > 0 ? `Ref: ${ultimoKmRegistrado}` : "Ex: 15.000"}
              error={errors.kmAtual?.message}
              className="font-mono font-black text-primary"
              disabled={isLocked}
              containerClassName="!mb-1"
            />
            {ultimoKmRegistrado > 0 && (
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1.5 ml-1 truncate">
                Último Registro: <strong className="text-text-main font-mono">{ultimoKmRegistrado.toLocaleString('pt-BR')} km</strong>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <Input
            label="Identificação (Série / CA / Património)"
            {...register("numeroCA")}
            placeholder="Ex: BETONEIRA-01 ou CA-12345"
            error={errors.numeroCA?.message}
            disabled={isLocked}
          />
        </div>
      )}

      {alvoSelecionado === 'VEICULO' && isKmInvalido && (
        <div className="animate-in fade-in zoom-in-95 duration-300 min-w-0">
          <Callout variant="warning" title="Odómetro Inconsistente" icon={AlertTriangle}>
            O valor digitado (<strong className="font-mono">{kmAtualNum.toLocaleString('pt-BR')}</strong>) é <strong>menor</strong> que o último KM conhecido do veículo. Por favor, confirme se houve substituição de painel ou erro de digitação.
          </Callout>
        </div>
      )}

      {/* SEÇÃO 3: EXECUÇÃO */}
      <div className="flex items-center gap-2 mt-4 border-b border-border/50 pb-2">
        <span className="w-1.5 h-4 bg-blue-500 rounded-full shadow-sm"></span>
        <label className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Execução e Agendamento</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="min-w-0">
          <Controller
            control={control}
            name="fornecedorId"
            render={({ field }) => (
              <Select
                label="Oficina / Fornecedor"
                options={fornecedoresOpcoes}
                icon={<Wrench className="w-4 h-4" />}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.fornecedorId?.message}
                disabled={isLocked}
              />
            )}
          />
        </div>

        <div className="min-w-0">
          <Controller
            control={control}
            name="data"
            render={({ field }) => (
              <DatePicker disableFuture
                label="Data do Serviço / Fatura"
                placeholder="Selecione a data"
                date={field.value ? new Date(`${field.value}T12:00:00`) : undefined}
                onChange={(newDate) => {
                  field.onChange(newDate ? newDate.toISOString().split('T')[0] : '');
                }}
                error={errors.data?.message}
                disabled={isLocked}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}