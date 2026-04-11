// src/components/forms/FormRegistrarManutencao/Step1DadosGerais.tsx
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form'; // ✨ Adicionado Controller
import { Wrench, Truck, Gauge, AlertTriangle } from 'lucide-react'; // Removido Calendar (já vem no DatePicker)
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Callout } from '../../ui/Callout';
import { DatePicker } from '../../ui/DatePicker'; // ✨ Nosso novo DatePicker
import { formatKmVisual } from '../../../utils';
import { api } from '../../../services/api';
import { useVeiculos } from '../../../hooks/useVeiculos';
import { useFornecedores } from '../../../hooks/useFornecedores';
import type { Veiculo } from '../../../types';
import type { ManutencaoFormValues, TipoManutencao } from './schema';

export function Step1DadosGerais() {
  // ✨ Extraído o control do form context
  const { register, watch, setValue, control, formState: { errors, isSubmitting } } = useFormContext<ManutencaoFormValues>();
  
  const { data: veiculos = [], isLoading: loadV } = useVeiculos();
  const { data: fornecedores = [], isLoading: loadF } = useFornecedores();

  const isLocked = isSubmitting || loadV || loadF;
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  const alvoSelecionado = watch('alvo');
  const tipoManutencao = watch('tipo');
  const veiculoIdSelecionado = watch('veiculoId');
  const kmAtualVisual = watch('kmAtual');

  const kmAtualNum = Number(kmAtualVisual?.replace(/\D/g, '')) || 0;
  const isKmInvalido = ultimoKmRegistrado > 0 && kmAtualNum > 0 && kmAtualNum < ultimoKmRegistrado;

  const fornecedoresOpcoes = useMemo(() => 
    fornecedores.filter(f => {
        if (['OFICINA', 'MECANICA', 'OUTRO'].includes(f.tipo)) return true;
        if (['LAVA_JATO', 'POSTO'].includes(f.tipo)) return tipoManutencao === 'PREVENTIVA';
        return false;
      }).map(f => ({ value: f.id, label: f.nome })),
    [fornecedores, tipoManutencao]
  );

  const veiculosOpcoes = useMemo(() => 
    veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
    [veiculos]
  );

  useEffect(() => {
    let isMounted = true;
    if (alvoSelecionado !== 'VEICULO' || !veiculoIdSelecionado) {
      setUltimoKmRegistrado(0);
      return;
    }
    const fetchInfo = async () => {
      try {
        const { data } = await api.get<Veiculo>(`/veiculos/${veiculoIdSelecionado}`);
        if (isMounted) setUltimoKmRegistrado(data.ultimoKm || 0);
      } catch (err) { console.error(err); }
    };
    fetchInfo();
    return () => { isMounted = false; };
  }, [veiculoIdSelecionado, alvoSelecionado]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* SELEÇÃO DO TIPO (CORRETIVA / PREVENTIVA) */}
      <div className="grid grid-cols-2 gap-2 bg-surface-hover/80 p-1.5 rounded-[1rem] border border-border/60 shadow-inner">
        {['CORRETIVA', 'PREVENTIVA'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue('tipo', t as TipoManutencao)}
            disabled={isLocked}
            className={`
              py-3 text-xs font-black tracking-widest uppercase rounded-xl transition-all duration-300
              ${tipoManutencao === t 
                ? (t === 'CORRETIVA' ? 'bg-error text-white shadow-md' : 'bg-success text-white shadow-md')
                : 'text-text-muted hover:text-text-main hover:bg-surface/80'}
            `}
          >
            {t}
          </button>
        ))}
      </div>

      {/* SELEÇÃO DO ALVO */}
      <div className="flex flex-col sm:flex-row gap-3">
        {['VEICULO', 'OUTROS'].map(alvo => (
          <label key={alvo} className={`flex items-center gap-3 cursor-pointer p-3.5 border rounded-2xl w-full transition-all duration-200 select-none ${alvoSelecionado === alvo ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-surface-hover/50 hover:border-primary/30'}`}>
            <input
              type="radio"
              value={alvo}
              {...register('alvo')}
              disabled={isLocked}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-sm font-black text-text-main tracking-wide">
              {alvo === 'VEICULO' ? 'Veículo da Frota' : 'Equipemento Externo'}
            </span>
          </label>
        ))}
      </div>

      {alvoSelecionado === 'VEICULO' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="Veículo"
            options={veiculosOpcoes}
            icon={<Truck className="w-4 h-4" />}
            {...register("veiculoId")}
            error={errors.veiculoId?.message}
            disabled={isLocked}
          />
          <div className="flex flex-col">
            <Input
              label="KM na entrada da oficina (Opcional)"
              icon={<Gauge className="w-4 h-4 text-primary" />}
              {...register("kmAtual")}
              onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
              placeholder={ultimoKmRegistrado > 0 ? `Ref: ${ultimoKmRegistrado}` : "Ex: 15.000"}
              error={errors.kmAtual?.message}
              className="font-mono font-black text-primary"
              disabled={isLocked}
              containerClassName="!mb-1"
            />
            {ultimoKmRegistrado > 0 && (
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1.5 ml-1">
                Último Registro: <strong className="text-text-main font-mono">{ultimoKmRegistrado.toLocaleString('pt-BR')} km</strong>
              </p>
            )}
          </div>
        </div>
      ) : (
        <Input 
          label="Identificação (Série / CA / Património)"
          {...register("numeroCA")}
          placeholder="Ex: BETONEIRA-01 ou CA-12345"
          error={errors.numeroCA?.message}
          disabled={isLocked}
        />
      )}

      {/* CALLOUT DE AVISO DE KM INCONSISTENTE */}
      {alvoSelecionado === 'VEICULO' && isKmInvalido && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <Callout variant="warning" title="Odómetro Inconsistente" icon={AlertTriangle}>
            O valor digitado (<strong className="font-mono">{kmAtualNum.toLocaleString('pt-BR')}</strong>) é <strong>menor</strong> que o último KM conhecido do veículo. Por favor, confirme se houve substituição de painel ou erro de digitação.
          </Callout>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          label="Oficina / Fornecedor"
          options={fornecedoresOpcoes}
          icon={<Wrench className="w-4 h-4" />}
          {...register("fornecedorId")}
          error={errors.fornecedorId?.message}
          disabled={isLocked}
        />
        
        {/* ✨ AQUI: Subistituído por DatePicker com Controller */}
        <Controller
          control={control}
          name="data"
          render={({ field }) => (
            <DatePicker disableFuture
              label="Data do Serviço / Fatura"
              placeholder="Selecione a data"
              // Convertendo de string para Date. O T12:00:00 blinda contra fuso horário anterior
              date={field.value ? new Date(`${field.value}T12:00:00`) : undefined}
              onChange={(newDate) => {
                // Ao clicar no calendário, salva no form como YYYY-MM-DD
                field.onChange(newDate ? newDate.toISOString().split('T')[0] : '');
              }}
              error={errors.data?.message}
              disabled={isLocked}
            />
          )}
        />
      </div>
    </div>
  );
}


