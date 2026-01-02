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

// --- SCHEMA ---
const planoSchema = z.object({
  veiculoId: z.string({ error: "Selecione um veículo" }).min(1, "Veículo obrigatório"),
  descricao: z.string({ error: "Descrição obrigatória" })
    .min(3, "Mínimo 3 letras")
    .transform(val => val.toUpperCase()),
  tipoIntervalo: z.enum(tiposIntervalo, { error: "Tipo inválido" }),
  // Coerce converte a string do input para number
  valorIntervalo: z.coerce.number({ error: "Informe o intervalo" })
    .min(1, "Deve ser maior que zero"),
});

// Tipagem separada para garantir segurança no TS (Input string -> Output number)
type PlanoFormInput = z.input<typeof planoSchema>;
type PlanoFormOutput = z.output<typeof planoSchema>;

interface FormPlanoManutencaoProps {
  veiculos: Veiculo[];
}

// Ícone Trash (Componente interno para limpeza)
function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

export function FormPlanoManutencao({ veiculos }: FormPlanoManutencaoProps) {
  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // [MELHORIA TÉCNICA] Tipagem completa: <Input, Context, Output>
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PlanoFormInput, any, PlanoFormOutput>({
    resolver: zodResolver(planoSchema),
    defaultValues: {
      veiculoId: '',
      descricao: '',
      tipoIntervalo: 'KM',
      valorIntervalo: '' // Inicia vazio visualmente (UX melhor que 0)
    },
    mode: 'onBlur'
  });

  const tipoIntervalo = watch('tipoIntervalo');

  // --- FETCH PLANOS ---
  const fetchPlanos = async () => {
    setLoadingList(true);
    try {
      const response = await api.get<PlanoManutencao[]>('/planos-manutencao');
      setPlanos(response.data);
    } catch (err) {
      toast.error("Erro ao carregar planos de manutenção.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchPlanos(); }, []);

  // --- CRIAR PLANO ---
  const onSubmit = async (data: PlanoFormOutput) => {
    const promise = api.post('/planos-manutencao', data);

    toast.promise(promise, {
      loading: 'Salvando plano...',
      success: () => {
        reset();
        fetchPlanos(); // Atualiza a lista imediatamente
        return 'Plano criado com sucesso!';
      },
      error: (err) => err.response?.data?.error || 'Erro ao criar o plano.'
    });
  };

  // --- DELETAR PLANO ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este plano de manutenção?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/planos-manutencao/${id}`);
      setPlanos(prev => prev.filter(p => p.id !== id)); // Otimista: remove localmente
      toast.success("Plano removido.");
    } catch (err) {
      toast.error("Erro ao remover plano.");
      fetchPlanos(); // [SEGURANÇA] Recarrega a lista se houver erro de sincronia
    } finally {
      setDeletingId(null);
    }
  };

  // --- HELPERS VISUAIS ---

  // Função segura para formatar data evitando crash em valores nulos
  const formatarDataSegura = (dataStr: string | null | undefined) => {
    if (!dataStr) return '--/--/----';
    try {
      // Adiciona hora fixa para evitar problemas de fuso horário (-3h) mudando o dia
      return new Date(dataStr.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch {
      return 'Data Inválida';
    }
  };

  // Estilos centralizados
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

      {/* COLUNA 1: FORMULÁRIO (Sticky) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-xl shadow-lg border border-border h-fit sticky top-6">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">Novo Plano</h4>
            <p className="text-xs text-gray-500">Configurar alertas automáticos.</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Veículo Alvo</label>
            <div className="relative">
              <select {...register('veiculoId')} className={selectStyle} disabled={isSubmitting}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
              </select>
              {/* Ícone Chevron */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.veiculoId && <p className="text-xs text-red-500 mt-1 ml-1">{errors.veiculoId.message}</p>}
          </div>

          <Input
            label="Descrição do Serviço"
            placeholder="Ex: TROCA DE ÓLEO"
            {...register('descricao')}
            error={errors.descricao?.message}
            disabled={isSubmitting}
            className="uppercase"
          />

          <div className="bg-background p-4 rounded-xl border border-border grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 text-center">Configuração do Ciclo</label>
            </div>

            <div>
              <div className="relative">
                <select {...register('tipoIntervalo')} className={selectStyle + " text-center font-bold"} disabled={isSubmitting}>
                  {tiposIntervalo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="relative">
              <Input
                type="number"
                placeholder={tipoIntervalo === 'KM' ? '10000' : '6'}
                {...register('valorIntervalo')}
                error={errors.valorIntervalo?.message}
                disabled={isSubmitting}
                className="text-center font-mono"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-gray-400 pointer-events-none uppercase">
                {tipoIntervalo === 'KM' ? 'KM' : 'MESES'}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full shadow-lg shadow-primary/20"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Criar Plano
          </Button>
        </form>
      </div>

      {/* COLUNA 2: LISTA (Scrollável) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Planos Ativos
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs border border-primary/20">{planos.length}</span>
          </h4>
        </div>

        {loadingList ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary mb-2"></div>
            <p className="text-sm text-gray-400">Carregando...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4 custom-scrollbar">
            {planos.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-background min-h-[300px]">
                <p className="text-gray-400 text-sm font-medium">Nenhum plano configurado.</p>
                <p className="text-gray-400 text-xs mt-1">Utilize o formulário ao lado para criar regras.</p>
              </div>
            )}

            {planos.map(plano => (
              <div key={plano.id} className="bg-white p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all relative group overflow-hidden">
                {/* Faixa Lateral Colorida */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${plano.tipoIntervalo === 'KM' ? 'bg-blue-500' : 'bg-green-500'}`} />

                <div className="flex justify-between items-start pl-3">
                  <div>
                    <h5 className="font-bold text-gray-800">{plano.descricao}</h5>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="bg-background px-1.5 py-0.5 rounded text-gray-700 border border-border">{plano.veiculo.placa}</span>
                      <span className="text-gray-300">•</span>
                      <span>{plano.veiculo.modelo}</span>
                    </p>
                  </div>

                  {/* Botão de Excluir */}
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(plano.id)}
                    isLoading={deletingId === plano.id}
                    className="!p-1.5 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50"
                    icon={<IconeLixo />}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between pl-3 pt-3 border-t border-background">
                  {/* Badge de Regra */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ciclo:</span>
                    <span className="text-sm font-bold text-gray-700 bg-background px-2 py-0.5 rounded border border-border">
                      {plano.valorIntervalo.toLocaleString('pt-BR')} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
                    </span>
                  </div>

                  {/* Badge de Próxima Manutenção */}
                  {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">Próxima:</span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        {plano.kmProximaManutencao.toLocaleString('pt-BR')} KM
                      </span>
                    </div>
                  )}
                  {plano.tipoIntervalo === 'TEMPO' && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">Próxima:</span>
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                        {formatarDataSegura(plano.dataProximaManutencao)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}