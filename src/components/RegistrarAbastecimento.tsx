import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
import type { User, Veiculo, Produto, Fornecedor } from '../types';

// --- SCHEMA ZOD V4 ---
const itemAbastecimentoSchema = z.object({
  produtoId: z.string({ error: "Selecione o produto" })
    .min(1, { error: "Selecione o produto" }),

  quantidade: z.coerce.number({ error: "Qtd inválida" })
    .gt(0, { error: "Deve ser maior que 0" }),

  valorPorUnidade: z.coerce.number({ error: "Valor inválido" })
    .gt(0, { error: "Deve ser maior que 0" }),
});

const abastecimentoSchema = z.object({
  veiculoId: z.string({ error: "Selecione o veículo" })
    .min(1, { error: "Selecione o veículo" }),

  operadorId: z.string().optional(),

  fornecedorId: z.string({ error: "Selecione o fornecedor" })
    .min(1, { error: "Selecione o fornecedor" }),

  kmOdometro: z.string({ error: "Informe o KM" })
    .min(1, { error: "Informe o KM atual" }),

  dataHora: z.string({ error: "Data é obrigatória" }),

  placaCartaoUsado: z.string({ error: "Cartão obrigatório" })
    .length(4, { error: "Deve ter exatamente 4 dígitos" })
    .regex(/^\d+$/, { error: "Apenas números" }),

  justificativa: z.string().optional(),

  itens: z.array(itemAbastecimentoSchema)
    .min(1, { error: "Adicione pelo menos um item" })
});

type AbastecimentoFormValues = z.input<typeof abastecimentoSchema>;

interface RegistrarAbastecimentoProps {
  usuarios: User[];
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  usuarioLogado?: User;
  veiculoPreSelecionadoId?: string;
  onClose?: () => void;
}

const selectStyle = "w-full px-4 py-2.5 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400 disabled:cursor-not-allowed";
const labelStyle = "block mb-1.5 text-sm font-bold text-text-secondary";

export function RegistrarAbastecimento({
  usuarios,
  veiculos,
  produtos,
  fornecedores,
  usuarioLogado,
  veiculoPreSelecionadoId,
  onClose
}: RegistrarAbastecimentoProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AbastecimentoFormValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      veiculoId: veiculoPreSelecionadoId || '',
      operadorId: usuarioLogado?.role === 'OPERADOR' ? usuarioLogado.id : '',
      fornecedorId: '',
      kmOdometro: '',
      dataHora: new Date().toISOString().slice(0, 16),
      placaCartaoUsado: '',
      justificativa: '',
      itens: [{ produtoId: '', quantidade: 0, valorPorUnidade: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  const itensWatch = useWatch({ control, name: "itens" });

  const totalGeral = itensWatch?.reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const val = Number(item.valorPorUnidade) || 0;
    return acc + (qtd * val);
  }, 0) || 0;

  useEffect(() => {
    if (veiculoPreSelecionadoId) {
      setValue('veiculoId', veiculoPreSelecionadoId);
    }
  }, [veiculoPreSelecionadoId, setValue]);

  const produtosAbastecimento = produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo));
  const fornecedoresPosto = fornecedores.filter(f => f.tipo === 'POSTO');

  const isOperadorTravado = usuarioLogado?.role === 'OPERADOR';

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatKmVisual(rawValue);
    setValue('kmOdometro', formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: AbastecimentoFormValues) => {
    try {
      const dadosFormatados = {
        veiculoId: data.veiculoId,
        operadorId: data.operadorId || null,
        fornecedorId: data.fornecedorId,
        kmOdometro: parseDecimal(data.kmOdometro),
        dataHora: new Date(data.dataHora).toISOString(),
        placaCartaoUsado: DOMPurify.sanitize(data.placaCartaoUsado),
        justificativa: data.justificativa ? DOMPurify.sanitize(data.justificativa) : null,
        itens: data.itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
          valorPorUnidade: Number(item.valorPorUnidade)
        }))
      };

      setFormDataParaModal(dadosFormatados);
      setModalAberto(true);
    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      toast.error('Falha ao preparar dados.');
    }
  };

  const handleModalSuccess = () => {
    toast.success('Abastecimento registrado com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);

    reset({
      veiculoId: veiculoPreSelecionadoId || '',
      operadorId: usuarioLogado?.role === 'OPERADOR' ? usuarioLogado.id : '',
      fornecedorId: '',
      kmOdometro: '',
      dataHora: new Date().toISOString().slice(0, 16),
      placaCartaoUsado: '',
      justificativa: '',
      itens: [{ produtoId: '', quantidade: 0, valorPorUnidade: 0 }]
    });

    if (onClose) onClose();
  };

  return (
    <>
      <form className="space-y-8 bg-white p-6 rounded-card shadow-card border border-gray-100" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center mb-6 relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute -right-2 -top-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-3 ring-4 ring-green-50/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">Novo Abastecimento</h4>
          <p className="text-sm text-text-secondary mt-1">Registre combustíveis e aditivos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Veículo</label>
            <div className="relative group">
              <select
                className={selectStyle}
                {...register('veiculoId')}
                disabled={isSubmitting || !!veiculoPreSelecionadoId}
              >
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
            {errors.veiculoId && <p className="text-xs text-red-500 mt-1">{errors.veiculoId.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Motorista</label>
            <div className="relative group">
              <select
                className={selectStyle}
                {...register('operadorId')}
                disabled={isSubmitting || isOperadorTravado}
              >
                <option value="">Selecione...</option>
                {usuarios
                  .filter(u => ['OPERADOR', 'ENCARREGADO'].includes(u.role))
                  .map(u => <option key={u.id} value={u.id}>{u.nome}</option>)
                }
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Posto / Fornecedor</label>
            <div className="relative group">
              <select className={selectStyle} {...register('fornecedorId')} disabled={isSubmitting}>
                <option value="">Selecione...</option>
                {fornecedoresPosto.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
            {errors.fornecedorId && <p className="text-xs text-red-500 mt-1">{errors.fornecedorId.message}</p>}
          </div>

          <div>
            <Input
              label="KM Odômetro"
              inputMode="numeric"
              placeholder="Ex: 50.420"
              {...register('kmOdometro')}
              onChange={handleKmChange}
              error={errors.kmOdometro?.message}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelStyle}>Data e Hora</label>
            <Input type="datetime-local" {...register('dataHora')} disabled={isSubmitting} error={errors.dataHora?.message} />
          </div>

          <div>
            <Input
              label="Final do Cartão (4 dígitos)"
              inputMode="numeric"
              placeholder="Ex: 1234"
              maxLength={4}
              {...register('placaCartaoUsado')}
              disabled={isSubmitting}
              error={errors.placaCartaoUsado?.message}
            />
          </div>
        </div>

        <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide">Itens do Abastecimento</h4>
            <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
              {fields.length} item(ns)
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const qtd = Number(itensWatch?.[index]?.quantidade) || 0;
              const val = Number(itensWatch?.[index]?.valorPorUnidade) || 0;
              const subtotal = qtd * val;

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Combustível / Aditivo</label>
                    <div className="relative">
                      <select
                        className={selectStyle + " py-2 text-sm"}
                        {...register(`itens.${index}.produtoId`)}
                        disabled={isSubmitting}
                      >
                        <option value="">Selecione...</option>
                        {produtosAbastecimento.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                    {errors.itens?.[index]?.produtoId && <p className="text-[10px] text-red-500 pl-1">{errors.itens[index]?.produtoId?.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Litros</label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="!py-2 text-right text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      {...register(`itens.${index}.quantidade`)}
                      disabled={isSubmitting}
                      step="any"
                    />
                    {errors.itens?.[index]?.quantidade && <p className="text-[10px] text-red-500 pl-1">{errors.itens[index]?.quantidade?.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Valor Un.</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      className="!py-2 text-right text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      {...register(`itens.${index}.valorPorUnidade`)}
                      disabled={isSubmitting}
                    />
                    {errors.itens?.[index]?.valorPorUnidade && <p className="text-[10px] text-red-500 pl-1">{errors.itens[index]?.valorPorUnidade?.message}</p>}
                  </div>

                  <div className="sm:col-span-3 flex items-end justify-end gap-2 h-full pb-0.5">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Subtotal</p>
                      <p className="text-sm font-bold text-gray-700">{subtotal > 0 ? `R$ ${subtotal.toFixed(2)}` : 'R$ 0,00'}</p>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors mb-0.5"
                        disabled={isSubmitting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-between items-center pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ produtoId: '', quantidade: 0, valorPorUnidade: 0 })}
              className="text-xs h-8 bg-white"
              disabled={isSubmitting}
            >
              + Adicionar Item
            </Button>

            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-bold mr-2">Total Geral</span>
              <span className="text-xl font-bold text-green-600">R$ {totalGeral.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className={labelStyle}>Justificativa (Opcional)</label>
          <textarea
            className="w-full px-4 py-3 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all h-24"
            {...register('justificativa')}
            placeholder="Caso tenha usado o cartão de outro veículo ou ocorrido algo incomum..."
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1 py-3.5"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className={`py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 ${onClose ? 'flex-[2]' : 'w-full'}`}
          >
            {isSubmitting ? 'Validando...' : 'Registrar Abastecimento'}
          </Button>
        </div>

      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          titulo="Envie a foto da nota fiscal"
          dadosJornada={formDataParaModal}
          apiEndpoint="/abastecimentos"
          apiMethod="POST"
          kmParaConfirmar={null}
          jornadaId={null}
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}