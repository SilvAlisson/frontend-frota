import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // Import V4 limpo
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

const tiposFornecedor = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- SCHEMA ZOD V4 ---
const fornecedorSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" })
    .min(2, { error: "Nome deve ter pelo menos 2 caracteres" })
    .transform(val => val.trim().toUpperCase()),

  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
      error: "Formato inválido: 00.000.000/0000-00"
    }),
  ]).optional().nullable(),

  // O .default() torna o input opcional, mas a saída obrigatória
  tipo: z.enum(tiposFornecedor, { error: "Selecione a categoria" })
    .default('OUTROS'),
});

// --- CORREÇÃO DOS TIPOS (SOLUÇÃO DOS ERROS) ---
// 1. Tipo de Entrada (O que o formulário manipula no front, aceita undefined nos defaults)
type FornecedorInput = z.input<typeof fornecedorSchema>;

// 2. Tipo de Saída (O que o Zod entrega após validação/transformação, sem undefined)
type FornecedorOutput = z.output<typeof fornecedorSchema>;

interface FormCadastrarFornecedorProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ onSuccess, onCancelar }: FormCadastrarFornecedorProps) {

  // A MÁGICA ACONTECE AQUI: Passamos 3 genéricos para o useForm
  // <TipoEntrada, Contexto, TipoSaida>
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FornecedorInput, any, FornecedorOutput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      // Agora o TS aceita isso, pois o Input permite undefined/optional devido ao .default()
      tipo: 'OUTROS',
    },
    mode: 'onBlur'
  });

  // O data aqui agora é automaticamente inferido como FornecedorOutput
  const onSubmit = async (data: FornecedorOutput) => {
    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      cnpj: data.cnpj && data.cnpj.trim() !== ''
        ? DOMPurify.sanitize(data.cnpj)
        : null,
      tipo: data.tipo,
    };

    const promise = api.post('/fornecedor', payload);

    toast.promise(promise, {
      loading: 'Cadastrando parceiro...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 800);
        return `Fornecedor "${response.data.nome}" cadastrado!`;
      },
      error: (err) => {
        console.error("Erro ao cadastrar:", err);
        return err.response?.data?.error || 'Falha ao cadastrar. Verifique os dados.';
      }
    });
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      {/* ... (O resto do JSX permanece idêntico ao anterior) ... */}

      {/* Apenas para contexto visual, o trecho do Select permanece igual: */}
      <div className="text-center relative">
        {/* Cabeçalho omitido para economizar espaço */}
      </div>

      <div className="space-y-5 px-1">
        <Input
          label="Nome do Fornecedor / Razão Social"
          placeholder="Ex: POSTO MATRIZ LTDA"
          {...register('nome')}
          error={errors.nome?.message}
          disabled={isSubmitting}
          autoFocus
          className="uppercase font-medium"
        />

        {/* CAMPO DE TIPO */}
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Categoria</label>
          <div className="relative group">
            <select
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-input appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer hover:border-gray-400"
              {...register('tipo')}
              disabled={isSubmitting}
            >
              <option value="POSTO">Posto de Combustível</option>
              <option value="OFICINA">Oficina Mecânica</option>
              <option value="LAVA_JATO">Lava Jato</option>
              <option value="SEGURADORA">Seguradora</option>
              <option value="OUTROS">Outros Serviços</option>
            </select>
            {/* Seta do select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.tipo && <p className="mt-1 text-xs text-error animate-pulse">{errors.tipo.message}</p>}
        </div>

        <Input
          label="CNPJ (Opcional)"
          placeholder="00.000.000/0000-00"
          {...register('cnpj')}
          error={errors.cnpj?.message}
          disabled={isSubmitting}
        />
        <p className="text-[10px] text-gray-400 pl-1 -mt-3">
          Se preenchido, use o formato: 00.000.000/0000-00
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
        <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="flex-[2]" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Confirmar Cadastro'}
        </Button>
      </div>
    </form>
  );
}