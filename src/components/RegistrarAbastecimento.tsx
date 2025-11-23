import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { formatKmVisual, parseDecimal } from '../utils';
// Importação de tipos (corrigido para verbatimModuleSyntax)
import type { Veiculo, User, Produto, Fornecedor } from '../types';

// --- 1. SCHEMA DE VALIDAÇÃO (ZOD) ---
const abastecimentoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  operadorId: z.string().min(1, "Selecione um operador"),
  fornecedorId: z.string().min(1, "Selecione um fornecedor"),
  // Refine garante que o KM visual (string) seja um número válido maior que 0
  kmOdometro: z.string().min(1, "KM é obrigatório").refine((val) => parseDecimal(val) > 0, "KM deve ser válido"),
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  placaCartaoUsado: z.string().length(4, "Deve ter exatamente 4 dígitos"),
  justificativa: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o produto"),
    // z.coerce.number() converte strings de input HTML para numbers automaticamente
    quantidade: z.coerce.number().gt(0, "Deve ser maior que zero"),
    valorPorUnidade: z.coerce.number().gt(0, "Deve ser maior que zero"),
  })).min(1, "Adicione pelo menos um item")
});

// Tipo inferido do Schema
type AbastecimentoForm = z.infer<typeof abastecimentoSchema>;

// --- 2. PROPS TIPADAS ---
interface RegistrarAbastecimentoProps {
  token: string;
  usuarios: User[];
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
}

export function RegistrarAbastecimento({
  token,
  usuarios,
  veiculos,
  produtos,
  fornecedores
}: RegistrarAbastecimentoProps) {

  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);
  const [success, setSuccess] = useState('');

  // --- 3. SETUP DO REACT HOOK FORM ---
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AbastecimentoForm>({
    // Cast 'as any' resolve o conflito de tipagem estrita (unknown vs number) do ZodResolver
    // A lógica de runtime do z.coerce garante que será number.
    resolver: zodResolver(abastecimentoSchema) as any,
    defaultValues: {
      dataHora: new Date().toISOString().slice(0, 16),
      itens: [{ produtoId: '', quantidade: 0, valorPorUnidade: 0 }]
    }
  });

  // Gerenciador de Array de Itens Dinâmicos
  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  // Observar itens para calcular total em tempo real
  const itensObservados = watch("itens");

  // --- 4. HANDLERS ---

  const onValidSubmit = (data: AbastecimentoForm) => {
    // Prepara os dados finais
    const dadosFormatados = {
      ...data,
      kmOdometro: parseDecimal(data.kmOdometro), // Converte string visual para número
      dataHora: new Date(data.dataHora).toISOString(),
      // O Zod já garantiu que os números dos itens estão corretos via coerce
    };

    setFormDataParaModal(dadosFormatados);
    setModalAberto(true);
  };

  const handleModalSuccess = () => {
    setSuccess('Abastecimento registrado com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);
    reset(); // Limpa o formulário magicamente
    setTimeout(() => setSuccess(''), 5000);
  };

  // Formatador visual para o KM enquanto digita
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setValue("kmOdometro", formatKmVisual(rawValue));
  };

  // Estilos auxiliares
  const selectClass = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";
  const labelClass = "block mb-1.5 text-sm font-medium text-text-secondary";

  return (
    <>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-primary">Novo Abastecimento</h4>
          <p className="text-sm text-text-secondary">Preencha os dados com atenção.</p>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Veículo */}
          <div>
            <label className={labelClass}>Veículo</label>
            <select {...register("veiculoId")} className={selectClass}>
              <option value="">Selecione...</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
            </select>
            {errors.veiculoId && <span className="text-xs text-error">{errors.veiculoId.message}</span>}
          </div>

          {/* Operador */}
          <div>
            <label className={labelClass}>Operador</label>
            <select {...register("operadorId")} className={selectClass}>
              <option value="">Selecione...</option>
              {usuarios.filter(u => u.role === 'OPERADOR').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            {errors.operadorId && <span className="text-xs text-error">{errors.operadorId.message}</span>}
          </div>

          {/* Fornecedor */}
          <div>
            <label className={labelClass}>Fornecedor</label>
            <select {...register("fornecedorId")} className={selectClass}>
              <option value="">Selecione...</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            {errors.fornecedorId && <span className="text-xs text-error">{errors.fornecedorId.message}</span>}
          </div>

          {/* KM (Com formatação visual) */}
          <div>
            <label className={labelClass}>KM Odômetro</label>
            <Input
              {...register("kmOdometro")}
              onChange={(e) => {
                register("kmOdometro").onChange(e); // Mantém o hook do RHF
                handleKmChange(e); // Aplica nossa formatação
              }}
              placeholder="Ex: 50.420"
              error={errors.kmOdometro?.message}
            />
          </div>

          {/* Data */}
          <div>
            <label className={labelClass}>Data e Hora</label>
            <Input type="datetime-local" {...register("dataHora")} error={errors.dataHora?.message} />
          </div>

          {/* Cartão */}
          <div>
            <label className={labelClass}>Final do Cartão (4 dígitos)</label>
            <Input
              type="number"
              placeholder="Ex: 1234"
              maxLength={4}
              {...register("placaCartaoUsado")}
              error={errors.placaCartaoUsado?.message}
            />
          </div>
        </div>

        {/* Itens Dinâmicos */}
        <div className="bg-gray-50 p-4 rounded-card border border-gray-200">
          <h4 className="text-sm font-bold text-text-secondary uppercase mb-3">Itens</h4>

          <div className="space-y-3">
            {fields.map((field, index) => {
              // Cálculo do total da linha para visualização
              const qtd = itensObservados[index]?.quantidade || 0;
              const val = itensObservados[index]?.valorPorUnidade || 0;
              const total = qtd * val;

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-gray-100">

                  <div className="sm:col-span-5">
                    <label className="text-xs text-gray-500 block mb-1">Produto</label>
                    <select {...register(`itens.${index}.produtoId`)} className={selectClass + " py-1 text-sm"}>
                      <option value="">Selecione...</option>
                      {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Qtd</label>
                    <Input type="number" step="0.01" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Valor Un.</label>
                    <Input type="number" step="0.01" {...register(`itens.${index}.valorPorUnidade`, { valueAsNumber: true })} />
                  </div>

                  <div className="sm:col-span-3 flex justify-end items-center gap-2">
                    <span className="text-sm font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      R$ {total.toFixed(2)}
                    </span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 font-bold px-2">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={() => append({ produtoId: '', quantidade: 0, valorPorUnidade: 0 })} className="text-xs">
              + Adicionar Item
            </Button>
            {errors.itens && <p className="text-xs text-error mt-2">{errors.itens.root?.message}</p>}
          </div>
        </div>

        {/* Justificativa */}
        <div>
          <label className={labelClass}>Justificativa (Opcional)</label>
          <textarea
            {...register("justificativa")}
            className={selectClass + " h-20 resize-none"}
            placeholder="Observações adicionais..."
          />
        </div>

        {success && <div className="p-3 bg-green-50 text-success rounded text-center font-medium">{success}</div>}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {isSubmitting ? 'Validando...' : 'Registrar Abastecimento'}
        </Button>
      </form>

      {/* Modal de Confirmação */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Foto da Nota Fiscal"
          kmParaConfirmar={formDataParaModal.kmOdometro}
          jornadaId={null}
          dadosJornada={formDataParaModal}
          apiEndpoint="/abastecimento"
          apiMethod="POST"
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}