import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import type { Veiculo } from '../../types';

// --- CONSTANTES ---
const tiposDeVeiculo = ["POLIGUINDASTE", "VACUO", "MUNCK", "UTILITARIO", "LEVE", "OUTRO"] as const;

// [CORREÇÃO CRÍTICA] A lista deve ser IDÊNTICA ao enum do Backend (Schema Zod e Prisma)
const tiposDeCombustivel = ["DIESEL_S10", "GASOLINA_COMUM", "ETANOL", "GNV"] as const;

const statusVeiculo = ["ATIVO", "EM_MANUTENCAO", "INATIVO"] as const;

// --- SCHEMA ---
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

  // [CORREÇÃO] Enum estrito para evitar erro 400 no backend
  tipoCombustivel: z.enum(tiposDeCombustivel).default('DIESEL_S10'),

  capacidadeTanque: z.coerce.number().positive("Deve ser maior que 0").optional().nullable(),

  // [REMOVIDO] mediaEstimada removida pois o Backend não salva este campo na rota PUT

  status: z.enum(statusVeiculo).default('ATIVO'),

  vencimentoCiv: z.string().optional().or(z.literal('')),
  vencimentoCipp: z.string().optional().or(z.literal('')),
});

// Tipagem Segura
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
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: { status: 'ATIVO' },
    mode: 'onBlur'
  });

  // --- CARREGAMENTO ---
  useEffect(() => {
    if (!veiculoId) return;
    const fetchVeiculo = async () => {
      setLoadingData(true);
      try {
        const { data: veiculo } = await api.get<Veiculo>(`/veiculos/${veiculoId}`);

        // Tratamento seguro para Enums (caso o banco tenha valor antigo ou fora da lista)
        const tipoVeiculoSafe = tiposDeVeiculo.includes(veiculo.tipoVeiculo as any) ? veiculo.tipoVeiculo : 'OUTRO';

        // [CORREÇÃO] Fallback seguro se o banco tiver valor antigo incompatível
        const tipoCombustivelSafe = tiposDeCombustivel.includes(veiculo.tipoCombustivel as any)
          ? veiculo.tipoCombustivel
          : 'DIESEL_S10';

        reset({
          placa: veiculo.placa,
          marca: veiculo.marca || '',
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          tipoVeiculo: (tipoVeiculoSafe as any),
          tipoCombustivel: (tipoCombustivelSafe as any),
          capacidadeTanque: veiculo.capacidadeTanque || 0,
          status: veiculo.status || 'ATIVO',
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
      tipoVeiculo: data.tipoVeiculo || null
      // mediaEstimada removida do payload
    };

    try {
      await api.put(`/veiculos/${veiculoId}`, payload);
      toast.success('Veículo atualizado!');
      onSuccess();
    } catch (e: any) {
      console.error(e);
      // Mensagem de erro mais detalhada caso venha do Zod Backend
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
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Veículo</h3>
          <p className="text-xs text-gray-500">Atualize especificações e status.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <span className="text-xl">🚛</span>
        </div>
      </div>

      <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>

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

        {/* DADOS TÉCNICOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Combustível</label>
            <div className="relative">
              <select className={selectStyle} {...register('tipoCombustivel')} disabled={isSubmitting}>
                {/* [CORREÇÃO] Labels amigáveis para o usuário */}
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
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
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