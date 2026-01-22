import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
// Importando as funções utilitárias que criamos hoje
import { formatKmVisual, parseDecimal } from '../../utils';
import { Wrench, AlertTriangle, Gauge } from 'lucide-react'; // Ícones

const tiposDeVeiculo = ["POLIGUINDASTE", "VACUO", "MUNCK", "UTILITARIO", "LEVE", "OUTRO"] as const;
const tiposDeCombustivel = ["DIESEL_S10", "GASOLINA_COMUM", "ETANOL", "GNV"] as const;
const statusVeiculo = ["ATIVO", "EM_MANUTENCAO", "INATIVO"] as const;

// --- SCHEMA ATUALIZADO ---
const veiculoSchema = z.object({
  placa: z.string({ error: "Placa obrigatória" })
    .length(7, { message: "Placa deve ter 7 caracteres" })
    .transform(val => val.trim().toUpperCase()),

  marca: z.string({ error: "Marca é obrigatória" }).min(2, { message: "Preencha a marca" }),
  modelo: z.string({ error: "Modelo é obrigatório" }).min(1, { message: "Preencha o modelo" }),

  ano: z.coerce.number({ error: "Ano inválido" })
    .min(1900, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano não pode ser futuro"),

  tipoVeiculo: z.enum(tiposDeVeiculo).nullable().optional(),
  tipoCombustivel: z.enum(tiposDeCombustivel).default('DIESEL_S10'),
  capacidadeTanque: z.coerce.number().positive("Deve ser maior que 0").optional().nullable(),
  status: z.enum(statusVeiculo).default('ATIVO'),

  // ✅ NOVO CAMPO: Edição Manual do Odômetro (String para máscara)
  ultimoKm: z.string().min(1, "KM é obrigatório"),

  vencimentoCiv: z.string().optional().or(z.literal('')),
  vencimentoCipp: z.string().optional().or(z.literal('')),
});

type VeiculoFormInput = z.input<typeof veiculoSchema>;
type VeiculoFormOutput = z.output<typeof veiculoSchema>;

interface FormEditarVeiculoProps {
  veiculoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarVeiculo({ veiculoId, onSuccess, onCancelar }: FormEditarVeiculoProps) {
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({ 
    resolver: zodResolver(veiculoSchema),
    mode: 'onBlur'
  });

  // --- CARREGAMENTO ---
  useEffect(() => {
    if (!veiculoId) return;
    const fetchVeiculo = async () => {
      setLoadingData(true);
      try {
        const { data: veiculo } = await api.get(`/veiculos/${veiculoId}`);

        const tipoVeiculoSafe = tiposDeVeiculo.includes(veiculo.tipoVeiculo as any) ? veiculo.tipoVeiculo : 'OUTRO';
        const tipoCombustivelSafe = tiposDeCombustivel.includes(veiculo.tipoCombustivel as any) ? veiculo.tipoCombustivel : 'DIESEL_S10';

        reset({
          placa: veiculo.placa,
          marca: veiculo.marca || '',
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          tipoVeiculo: (tipoVeiculoSafe as any),
          tipoCombustivel: (tipoCombustivelSafe as any),
          capacidadeTanque: veiculo.capacidadeTanque || 0,
          status: veiculo.status || 'ATIVO',

          // ✅ Formata o KM vindo do banco (ex: 325178 -> 325.178)
          ultimoKm: formatKmVisual(veiculo.ultimoKm),

          vencimentoCiv: veiculo.vencimentoCiv ? new Date(veiculo.vencimentoCiv).toISOString().split('T')[0] : '',
          vencimentoCipp: veiculo.vencimentoCipp ? new Date(veiculo.vencimentoCipp).toISOString().split('T')[0] : ''
        });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar dados.');
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };
    fetchVeiculo();
  }, [veiculoId, reset, onCancelar]);

  // Handler para formatar KM enquanto digita
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("ultimoKm", formatKmVisual(e.target.value));
  };

  // --- SUBMISSÃO ---
  const onSubmit = async (data: VeiculoFormOutput) => {
    const formatarDataIsoSegura = (dateStr: string | null | undefined) => {
      if (!dateStr) return null;
      return new Date(`${dateStr}T12:00:00`).toISOString();
    };

    const payload = {
      ...data,
      vencimentoCiv: formatarDataIsoSegura(data.vencimentoCiv),
      vencimentoCipp: formatarDataIsoSegura(data.vencimentoCipp),
      capacidadeTanque: data.capacidadeTanque || null,
      tipoVeiculo: data.tipoVeiculo || null,

      // ✅ CORREÇÃO CRÍTICA AQUI:
      // O backend espera "kmAtual" para atualizar o odômetro.
      // Antes estava enviando "ultimoKm", que o backend ignorava.
      kmAtual: parseDecimal(data.ultimoKm) 
    };

    try {
      await api.put(`/veiculos/${veiculoId}`, payload);
      toast.success('Veículo e Odômetro atualizados!');
      onSuccess();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.error || 'Falha ao salvar as alterações.';
      toast.error(msg);
    }
  };

  // --- ESTILOS ---
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  if (loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary"></div>
        <p className="text-sm text-gray-400 font-medium mt-4 animate-pulse">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden flex flex-col max-h-[90vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Veículo</h3>
          <p className="text-xs text-gray-500">Atualize especificações e status.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <Wrench className="w-5 h-5" />
        </div>
      </div>

      <form className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1" onSubmit={handleSubmit(onSubmit)}>

        {/* IDENTIFICAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Placa (Imutável)</label>
            <Input
              {...register('placa')}
              disabled
              className="bg-gray-100 text-gray-500 cursor-not-allowed font-mono font-bold uppercase border-border"
            />
          </div>
          <Input
            label="Marca"
            placeholder="Ex: Mercedes-Benz"
            {...register('marca')}
            error={errors.marca?.message}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Modelo"
            {...register('modelo')}
            error={errors.modelo?.message}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ano Fab."
              type="number"
              {...register('ano')}
              error={errors.ano?.message}
              disabled={isSubmitting}
            />

            <div>
              <label className={labelStyle}>Tipo</label>
              <div className="relative">
                <select className={selectStyle} {...register('tipoVeiculo')} disabled={isSubmitting}>
                  <option value="">Selecione...</option>
                  {tiposDeVeiculo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- ÁREA DE CORREÇÃO DE ODÔMETRO (NOVO) --- */}
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-amber-100 p-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Correção Manual de Odômetro
            </label>
          </div>

          <div className="relative">
            <Input
              {...register('ultimoKm')}
              onChange={(e) => { register('ultimoKm').onChange(e); handleKmChange(e); }}
              className="bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-500/20 font-mono text-xl font-black text-gray-800 tracking-wider h-12 pr-10"
              placeholder="0"
              disabled={isSubmitting}
              error={errors.ultimoKm?.message}
            />
            <Gauge className="absolute right-3 top-3.5 w-5 h-5 text-amber-400 pointer-events-none" />
          </div>

          <p className="text-[10px] text-amber-700 mt-2 leading-relaxed opacity-90 pl-1 border-l-2 border-amber-300">
            ⚠️ <strong>Atenção:</strong> Altere este valor para corrigir erros de digitação (ex: 300.000 vs 30.000).
            Isso redefinirá o ponto de partida para os próximos lançamentos deste veículo.
          </p>
        </div>
        {/* ----------------------------------------------- */}

        {/* DADOS TÉCNICOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Combustível</label>
            <div className="relative">
              <select className={selectStyle} {...register('tipoCombustivel')} disabled={isSubmitting}>
                <option value="DIESEL_S10">Diesel S10</option>
                <option value="GASOLINA_COMUM">Gasolina Comum</option>
                <option value="ETANOL">Etanol</option>
                <option value="GNV">GNV</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="relative">
            <Input
              label="Tanque (L)"
              type="number"
              {...register('capacidadeTanque')}
              error={errors.capacidadeTanque?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* STATUS OPERACIONAL */}
        <div>
          <label className={labelStyle}>Status Operacional</label>
          <div className="relative">
            <select className={selectStyle} {...register('status')} disabled={isSubmitting}>
              <option value="ATIVO">🟢 Ativo (Em Operação)</option>
              <option value="EM_MANUTENCAO">🔧 Em Manutenção (Oficina)</option>
              <option value="INATIVO">🔴 Inativo (Baixado/Vendido)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 ml-1">
            * Veículos inativos não aparecem na lista de abastecimento.
          </p>
        </div>

        {/* DOCUMENTAÇÃO */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <Input
            label="Vencimento CIV"
            type="date"
            {...register('vencimentoCiv')}
            error={errors.vencimentoCiv?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Vencimento CIPP"
            type="date"
            {...register('vencimentoCipp')}
            error={errors.vencimentoCipp?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 pt-4 border-t border-border mt-auto">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-[2] shadow-lg shadow-primary/20"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}