import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import type { PlanoManutencao, Veiculo } from '../../types';

const tiposIntervalo = ["KM", "TEMPO"] as const;

// --- SCHEMA ZOD V4 (Smart) ---
const planoSchema = z.object({
  veiculoId: z.string({ error: "Selecione um veículo" })
    .min(1, { message: "Veículo obrigatório" }),

  descricao: z.string({ error: "Descrição obrigatória" })
    .min(3, { message: "Descreva o plano (min. 3 caracteres)" })
    .transform(val => val.toUpperCase()),

  tipoIntervalo: z.enum(tiposIntervalo, {
    error: "Tipo de intervalo inválido"
  }),

  valorIntervalo: z.coerce.number({ error: "Informe o intervalo" })
    .min(1, { message: "O intervalo deve ser maior que zero" }),
});

type PlanoFormInput = z.input<typeof planoSchema>;

interface FormPlanoManutencaoProps {
  veiculos: Veiculo[];
}

function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

export function FormPlanoManutencao({ veiculos }: FormPlanoManutencaoProps) {

  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PlanoFormInput>({
    resolver: zodResolver(planoSchema),
    defaultValues: {
      veiculoId: '',
      descricao: '',
      tipoIntervalo: 'KM',
      valorIntervalo: 0 // Inicia com 0 para forçar o usuário a digitar
    },
    mode: 'onBlur'
  });

  const tipoIntervalo = watch('tipoIntervalo');

  // --- FETCH PLANOS ---
  const fetchPlanos = async () => {
    setLoadingList(true);
    try {
      // CORREÇÃO: Rota no plural
      const response = await api.get<PlanoManutencao[]>('/planos-manutencao');
      setPlanos(response.data);
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
      toast.error("Não foi possível carregar os planos de manutenção.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  // --- CRIAR PLANO ---
  const onSubmit = async (data: PlanoFormInput) => {
    // CORREÇÃO: Rota no plural
    const promise = api.post('/planos-manutencao', data);

    toast.promise(promise, {
      loading: 'Criando plano preventivo...',
      success: () => {
        reset();
        fetchPlanos(); // Refresh na lista
        return 'Plano de manutenção criado com sucesso!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao criar o plano.';
      }
    });
  };

  // --- DELETAR PLANO ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este plano de manutenção?")) return;

    setDeletingId(id);
    // CORREÇÃO: Rota no plural
    const promise = api.delete(`/planos-manutencao/${id}`);

    toast.promise(promise, {
      loading: 'Removendo plano...',
      success: () => {
        setPlanos(prev => prev.filter(p => p.id !== id));
        setDeletingId(null);
        return 'Plano removido com sucesso.';
      },
      error: (err) => {
        console.error(err);
        setDeletingId(null);
        fetchPlanos();
        return err.response?.data?.error || 'Erro ao remover plano.';
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* COLUNA 1: FORMULÁRIO DE CRIAÇÃO */}
      <div className="bg-white p-6 rounded-card shadow-card border border-gray-100 h-fit sticky top-6">
        <div className="text-center md:text-left mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900 tracking-tight">
            Plano Preventivo
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Configure alertas automáticos por KM ou Tempo.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Veículo</label>
            <div className="relative group">
              <select
                className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
                {...register('veiculoId')}
                disabled={isSubmitting}
              >
                <option value="">Selecione um veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-orange-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.veiculoId && <p className="mt-1 text-xs text-error animate-pulse">{errors.veiculoId.message}</p>}
          </div>

          <Input
            label="Descrição do Plano"
            placeholder="Ex: TROCA DE ÓLEO MOTOR"
            {...register('descricao')}
            error={errors.descricao?.message}
            disabled={isSubmitting}
            className="uppercase"
          />

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 text-sm text-text bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none transition-all"
                  {...register('tipoIntervalo')}
                  disabled={isSubmitting}
                >
                  {tiposIntervalo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <Input
                label={tipoIntervalo === 'KM' ? 'Intervalo (KM)' : 'Intervalo (Meses)'}
                type="number"
                placeholder={tipoIntervalo === 'KM' ? 'Ex: 10000' : 'Ex: 6'}
                {...register('valorIntervalo')}
                error={errors.valorIntervalo?.message}
                disabled={isSubmitting}
                className="bg-white"
              />
              {/* Dica visual */}
              <div className="absolute top-0 right-0 text-[10px] text-gray-400 font-medium px-1 py-1">
                {tipoIntervalo === 'KM' ? 'kms' : 'meses'}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Criar Plano de Manutenção'}
          </Button>
        </form>
      </div>

      {/* COLUNA 2: LISTA DE PLANOS ATIVOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Planos Ativos
            <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
              {planos.length}
            </span>
          </h4>
        </div>

        {loadingList && (
          <div className="flex flex-col items-center justify-center py-12 opacity-60">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-orange-500 mb-3"></div>
            <p className="text-sm text-gray-500 font-medium">Carregando planos...</p>
          </div>
        )}

        <div className="space-y-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-4">
          {!loadingList && planos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <div className="p-3 bg-white rounded-full mb-3 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-sm">Nenhum plano configurado.</p>
              <p className="text-gray-400 text-xs mt-1">Utilize o formulário ao lado para criar regras.</p>
            </div>
          )}

          {planos.map(plano => (
            <div key={plano.id} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">

              {/* Barra lateral colorida indicando tipo */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${plano.tipoIntervalo === 'KM' ? 'bg-blue-500' : 'bg-green-500'}`}></div>

              <div className="flex justify-between items-start pl-3">
                <div>
                  <h5 className="font-bold text-gray-800 text-base">{plano.descricao}</h5>
                  <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{plano.veiculo.placa}</span>
                    <span className="text-gray-400">•</span>
                    <span>{plano.veiculo.modelo}</span>
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="!p-1.5 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => handleDelete(plano.id)}
                  isLoading={deletingId === plano.id}
                  title="Remover Plano"
                  icon={<IconeLixo />}
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Regra</span>
                  <span className="text-sm font-bold text-gray-700">
                    {plano.valorIntervalo.toLocaleString('pt-BR')} <span className="text-xs font-normal text-gray-500">{plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}</span>
                  </span>
                </div>

                {/* Badge de Próxima Manutenção */}
                {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Próxima Revisão</p>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      {plano.kmProximaManutencao.toLocaleString('pt-BR')} KM
                    </span>
                  </div>
                )}
                {plano.tipoIntervalo === 'TEMPO' && plano.dataProximaManutencao && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Próxima Revisão</p>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                      {new Date(plano.dataProximaManutencao).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}