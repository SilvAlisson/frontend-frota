import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

const tipos = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- SCHEMA ROBUSTO ---
const fornecedorSchema = z.object({
  nome: z.string()
    .min(2, "Nome obrigatório (mín. 2 caracteres)")
    .transform(val => val.trim().toUpperCase()),

  // Validação de formato (Opcional, mas se preenchido deve ser válido)
  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Formato inválido: 00.000.000/0000-00")
  ]).optional().nullable(),

  tipo: z.enum(tipos).default('OUTROS'),
});

// Tipagem separada para Input (Formulário) e Output (Dados processados pelo Zod)
type FormInput = z.input<typeof fornecedorSchema>;
type FormOutput = z.output<typeof fornecedorSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ onSuccess, onCancelar }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormInput, any, FormOutput>({ // [CORREÇÃO 2: Tipagem] Genéricos explícitos evitam o 'as any'
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      tipo: 'OUTROS'
    },
    mode: 'onBlur' // [CORREÇÃO 1: UX] Validação apenas ao sair do campo
  });

  const onSubmit = async (data: FormOutput) => {
    // Sanitização e tratamento de dados vazios
    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      tipo: data.tipo,
      // Lógica para enviar null caso o CNPJ esteja vazio ou só com espaços
      cnpj: data.cnpj && data.cnpj.trim() !== '' ? DOMPurify.sanitize(data.cnpj) : null,
    };

    const promise = api.post('/fornecedores', payload);

    toast.promise(promise, {
      loading: 'Cadastrando parceiro...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 500);
        // Usa o nome retornado pelo backend para feedback personalizado
        return `Parceiro "${response.data.nome}" cadastrado!`;
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Erro ao cadastrar fornecedor.';
      }
    });
  };

  // Estilos Auxiliares
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-300">

      {/* Cabeçalho */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Novo Parceiro</h3>
          <p className="text-xs text-gray-500">Cadastro de oficinas e postos.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" /></svg>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

        <div>
          <label className={labelStyle}>Razão Social / Nome</label>
          <Input
            {...register('nome')}
            placeholder="Ex: AUTO CENTER LTDA"
            error={errors.nome?.message}
            className="uppercase font-medium"
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Categoria</label>
            <div className="relative">
              <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                {tipos.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>CNPJ (Opcional)</label>
            <Input
              {...register('cnpj')}
              placeholder="00.000.000/0000-00"
              error={errors.cnpj?.message}
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Formato: XX.XXX.XXX/XXXX-XX</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<span>🤝</span>}
            className="shadow-lg shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Parceiro'}
          </Button>
        </div>
      </form>
    </div>
  );
}