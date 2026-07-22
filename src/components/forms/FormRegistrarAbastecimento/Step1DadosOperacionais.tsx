import { useEffect, useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Fuel, User, Gauge, Calendar, AlertTriangle } from 'lucide-react';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { Callout } from '../../ui/Callout';
import { formatKmVisual } from '../../../utils';
import { useVeiculos } from '../../../hooks/useVeiculos';
import { useUsuarios } from '../../../hooks/useUsuarios';
import type { AbastecimentoFormValues } from './schema';
import type { Veiculo } from '../../../types';

export function Step1DadosOperacionais() {
  const { register, watch, setValue, getValues, formState: { errors, isSubmitting } } = useFormContext<AbastecimentoFormValues>();
  
  const { data: veiculos = [], isLoading: loadV } = useVeiculos();
  const { usuarios = [], isLoading: loadU } = useUsuarios();

  const isLocked = isSubmitting || loadV || loadU;
  const [ultimoKm, setUltimoKm] = useState<number>(0);

  const veiculoIdSelecionado = watch('veiculoId');
  const kmAtualVisual = watch('kmAtual');

  // Lógica para max date local (evitar datas futuras)
  const agoraLocal = new Date();
  agoraLocal.setMinutes(agoraLocal.getMinutes() - agoraLocal.getTimezoneOffset());
  const maxDateTime = agoraLocal.toISOString().slice(0, 16);

  // Lógica para disparar o Callout de aviso
  const kmAtualNum = Number(kmAtualVisual?.replace(/\D/g, '')) || 0;
  const isKmInvalido = ultimoKm > 0 && kmAtualNum > 0 && kmAtualNum < ultimoKm;

  const veiculoOptions = useMemo(() =>
    veiculos
      .filter(v => v.status !== 'INATIVO')
      .map(v => ({ value: v.id, label: v.placa })),
    [veiculos]
  );

  // 1. IDENTIFICADOR SEGURO DE FROTA PESADA
  // Mapeia os tipos que exigem capacitação. Qualquer outro será tratado como leve/livre.
  const isVeiculoPesado = useMemo(() => {
    const v = veiculos.find((veiculo: Veiculo) => veiculo.id === veiculoIdSelecionado);
    const tiposRestritos = ['POLIGUINDASTE', 'VACUO', 'MUNCK', 'CAMINHAO', 'PESADO'];
    
    return v ? tiposRestritos.includes(v.tipoVeiculo?.toUpperCase() || '') : false;
  }, [veiculoIdSelecionado, veiculos]);

  // 2. FILTRO DINÂMICO INTELIGENTE
  const operadorOptions = useMemo(() => {
    return usuarios
      .filter(u => !u.nome.startsWith('[INATIVO]')) // Remove inativos
      .filter(u => {
        if (isVeiculoPesado) {
           // Trava: Apenas Operadores OU integrantes com interinidade ativa
           return u.role === 'OPERADOR' || u.permiteOperacao === true; 
        }
        // Liberação: Se for veículo leve, qualquer integrante ativo da equipe pode abastecer
        return true;
      })
      .map(u => ({ value: u.id, label: u.nome }));
  }, [usuarios, isVeiculoPesado]);

  useEffect(() => {
    if (veiculoIdSelecionado) {
      const v = veiculos.find((v: Veiculo) => v.id === veiculoIdSelecionado);
      if (v) {
        setUltimoKm(v.ultimoKm || 0);
      }
    } else {
      setUltimoKm(0);
    }
  }, [veiculoIdSelecionado, veiculos]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
        <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Dados Operacionais</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <Select
          label="Veículo da Frota"
          options={veiculoOptions}
          icon={<Fuel className="w-4 h-4" />}
          {...register('veiculoId')}
          error={errors.veiculoId?.message as string}
          disabled={isLocked}
        />

        {/* containerClassName="md:col-span-2" */}
        <Select
          label={isVeiculoPesado ? "Operador / Motorista" : "Integrante Responsável"}
          options={operadorOptions}
          icon={<User className="w-4 h-4" />}
          {...register('operadorId')}
          error={errors.operadorId?.message as string}
          disabled={isLocked}
        />

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          <div className="flex flex-col">
            <Input
              label="KM do Painel (Hodômetro)"
              type="tel"
              icon={<Gauge className="w-4 h-4 text-primary" />} 
              inputMode="numeric"
              {...register('kmAtual', {
                onChange: (e) => {
                  const formatted = formatKmVisual(e.target.value);
                  setValue('kmAtual', formatted, { shouldValidate: true });
                }
              })}
              placeholder={ultimoKm > 0 ? `Ex: ${ultimoKm.toLocaleString('pt-BR')}` : "Ex: 15.000"}
              error={errors.kmAtual?.message as string}
              className="font-mono text-lg font-black text-primary"
              disabled={isLocked}
              containerClassName="!mb-1"
            />
            {ultimoKm > 0 && (
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1.5 ml-1">
                Último Registro: <strong className="text-text-main font-mono">{ultimoKm.toLocaleString('pt-BR')} km</strong>
              </p>
            )}
          </div>

          <Input
            label="Data e Hora"
            type="datetime-local"
            icon={<Calendar className="w-4 h-4" />}
            max={maxDateTime}
            {...register('dataHora')}
            error={errors.dataHora?.message as string}
            disabled={isLocked}
          />
        </div>

        {/* CALLOUT DE AVISO DE KM INCONSISTENTE */}
        {isKmInvalido && (
          <div className="md:col-span-2 animate-in fade-in zoom-in-95 duration-300">
            <Callout variant="warning" title="Odômetro Inconsistente" icon={AlertTriangle}>
              O valor digitado (<strong className="font-mono">{kmAtualNum.toLocaleString('pt-BR')}</strong>) é <strong>menor</strong> que o último KM Registrado na base de dados para este veículo. Confirme se os dados estão corretos antes de avançar.
            </Callout>
          </div>
        )}

      </div>
    </div>
  );
}