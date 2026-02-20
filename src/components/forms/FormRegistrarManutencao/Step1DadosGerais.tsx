// src/components/forms/FormRegistrarManutencao/Step1DadosGerais.tsx
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Wrench, Truck, Calendar, Gauge } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { formatKmVisual } from '../../../utils';
import { api } from '../../../services/api';
import { useVeiculos } from '../../../hooks/useVeiculos';
import { useFornecedores } from '../../../hooks/useFornecedores';
import type { Veiculo } from '../../../types';
import type { ManutencaoFormValues, TipoManutencao } from './schema';

export function Step1DadosGerais() {
  const { register, watch, setValue, formState: { errors, isSubmitting } } = useFormContext<ManutencaoFormValues>();
  
  const { data: veiculos = [], isLoading: loadV } = useVeiculos();
  const { data: fornecedores = [], isLoading: loadF } = useFornecedores();

  const isLocked = isSubmitting || loadV || loadF;
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  const alvoSelecionado = watch('alvo');
  const tipoManutencao = watch('tipo');
  const veiculoIdSelecionado = watch('veiculoId');

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
      <div className="grid grid-cols-2 gap-2 bg-surface-hover p-1.5 rounded-xl border border-border/60 shadow-inner">
        {['CORRETIVA', 'PREVENTIVA'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue('tipo', t as TipoManutencao)}
            disabled={isLocked}
            className={`
              py-2.5 text-xs font-black tracking-widest uppercase rounded-lg transition-all
              ${tipoManutencao === t 
                ? (t === 'CORRETIVA' ? 'bg-error text-white shadow-sm' : 'bg-success text-white shadow-sm')
                : 'text-text-muted hover:text-text-main hover:bg-background'}
            `}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {['VEICULO', 'OUTROS'].map(alvo => (
          <label key={alvo} className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl w-full transition-all ${alvoSelecionado === alvo ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-surface-hover'}`}>
            <input
              type="radio"
              value={alvo}
              {...register('alvo')}
              disabled={isLocked}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm font-bold text-text-main">
              {alvo === 'VEICULO' ? 'Veículo da Frota' : 'Outro Equipamento'}
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
          <div>
            <Input
              label="KM no momento do envio (Opcional)"
              icon={<Gauge className="w-4 h-4 text-primary" />}
              {...register("kmAtual")}
              onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
              placeholder={ultimoKmRegistrado > 0 ? `Ref: ${ultimoKmRegistrado}` : "Ex: 15.000"}
              error={errors.kmAtual?.message}
              className="font-mono font-bold text-primary"
              disabled={isLocked}
            />
          </div>
        </div>
      ) : (
        <Input 
          label="Identificação (Série / CA / Patrimônio)"
          {...register("numeroCA")}
          placeholder="Ex: BETONEIRA-01 ou CA-12345"
          error={errors.numeroCA?.message}
          disabled={isLocked}
        />
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
        <Input
          label="Data do Serviço"
          type="date"
          icon={<Calendar className="w-4 h-4" />}
          {...register("data")}
          error={errors.data?.message}
          disabled={isLocked}
        />
      </div>
    </div>
  );
}