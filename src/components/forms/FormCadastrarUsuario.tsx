import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Interface para Cargo
interface Cargo {
  id: string;
  nome: string;
}

const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// --- SCHEMA ZOD V4 (Robustez & Segurança) ---
const usuarioSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" })
    .min(3, { error: "Nome muito curto (mín. 3 letras)" })
    .transform(val => val.trim()), // Sanitização básica

  email: z.string({ error: "Email é obrigatório" })
    .email({ error: "Formato de email inválido" })
    .toLowerCase(),

  password: z.string({ error: "Senha é obrigatória" })
    .min(6, { error: "A senha deve ter no mínimo 6 caracteres" }),

  matricula: z.string().optional().or(z.literal('')),

  role: z.enum(ROLES, {
    error: "Selecione uma função válida"
  }),

  // Campos condicionais (RH) - Validação base, refinada no submit
  cargoId: z.string().optional().or(z.literal('')),
  cnhNumero: z.string().optional().or(z.literal('')),
  cnhCategoria: z.string().optional().or(z.literal('')),
  cnhValidade: z.string().optional().or(z.literal('')),
  dataAdmissao: z.string().optional().or(z.literal('')),
});

type UsuarioFormInput = z.input<typeof usuarioSchema>;

interface FormCadastrarUsuarioProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ onSuccess, onCancelar }: FormCadastrarUsuarioProps) {

  const { data: cargos = [], isLoading: isLoadingCargos } = useQuery<Cargo[]>({
    queryKey: ['cargos-select'],
    queryFn: async () => {
      const response = await api.get('/cargos');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos de cache
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UsuarioFormInput>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      matricula: '',
      role: 'OPERADOR', // Default mais comum
      cargoId: '',
      cnhNumero: '',
      cnhCategoria: '',
      cnhValidade: '',
      dataAdmissao: ''
    },
    mode: 'onBlur'
  });

  const roleSelecionada = watch('role');

  const onSubmit = async (data: UsuarioFormInput) => {
    // Lógica de Negócio: Limpar campos de RH se não for Operador
    // Isso garante a integridade dos dados no backend
    const isOperador = data.role === 'OPERADOR';

    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      email: DOMPurify.sanitize(data.email),
      password: data.password,
      matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
      role: data.role,

      // Envia null se não for operador ou se o campo estiver vazio
      cargoId: isOperador && data.cargoId ? data.cargoId : null,
      cnhNumero: isOperador && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOperador && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOperador && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
    };

    const promise = api.post('/user/register', payload);

    toast.promise(promise, {
      loading: 'Criando credenciais de acesso...',
      success: () => {
        reset();
        setTimeout(onSuccess, 800);
        return 'Colaborador cadastrado com sucesso!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Erro ao cadastrar. Verifique o email.';
      }
    });
  };

  // Helper para rótulos amigáveis no select
  const getRoleLabel = (role: typeof ROLES[number]) => {
    switch (role) {
      case 'OPERADOR': return 'Motorista (Operador)';
      case 'ENCARREGADO': return 'Gestor de Frota (Encarregado)';
      case 'RH': return 'Recursos Humanos (RH)';
      case 'COORDENADOR': return 'Coordenador Geral';
      case 'ADMIN': return 'Administrador do Sistema';
      default: return role;
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

      {/* HEADER VISUAL */}
      <div className="text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent rounded-full" />

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm ring-4 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
          Novo Colaborador
        </h4>
        <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
          Crie o acesso para motoristas, gestores ou equipe administrativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">

        {/* DADOS PESSOAIS E ACESSO */}
        <div className="md:col-span-2">
          <Input
            label="Nome Completo"
            placeholder="Ex: João da Silva"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <Input
          label="Email Corporativo"
          type="email"
          placeholder="joao@empresa.com"
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
        />

        <div className="relative group">
          <Input
            label="Senha Inicial"
            type="password"
            placeholder="******"
            {...register('password')}
            error={errors.password?.message}
            disabled={isSubmitting}
          />
          {/* Micro-interação: Dica de senha */}
          <span className="absolute right-0 top-0 text-[10px] text-gray-400 font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Mín. 6 dígitos
          </span>
        </div>

        <Input
          label="Matrícula (Opcional)"
          placeholder="Ex: 12345"
          {...register('matricula')}
          error={errors.matricula?.message}
          disabled={isSubmitting}
        />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função / Perfil</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
              {...register('role')}
              disabled={isSubmitting}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.role && <p className="text-xs text-error mt-1 animate-pulse">{errors.role.message}</p>}
        </div>
      </div>

      {/* SEÇÃO RH (CONDICIONAL COM ANIMAÇÃO) */}
      {/* Usamos max-h e opacity para transição suave ao invés de montar/desmontar */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${roleSelecionada === 'OPERADOR' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-50'}`}>
        <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Dados Funcionais (RH)
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-colors hover:border-indigo-100">
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Cargo / Função</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm"
                  {...register('cargoId')}
                  disabled={isSubmitting || isLoadingCargos}
                >
                  <option value="">Selecione o cargo...</option>
                  {cargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {isLoadingCargos && <p className="text-xs text-primary mt-1 animate-pulse">Sincronizando cargos...</p>}
            </div>

            <div className="md:col-span-1">
              <Input
                label="Nº CNH"
                placeholder="Registro CNH"
                {...register('cnhNumero')}
                disabled={isSubmitting}
                className="bg-white"
              />
            </div>
            <div className="md:col-span-1">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Categoria"
                  placeholder="AE"
                  {...register('cnhCategoria')}
                  disabled={isSubmitting}
                  className="bg-white text-center uppercase"
                  maxLength={2}
                />
                <Input
                  label="Validade CNH"
                  type="date"
                  {...register('cnhValidade')}
                  disabled={isSubmitting}
                  className="bg-white"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Data de Admissão"
                type="date"
                {...register('dataAdmissao')}
                disabled={isSubmitting}
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={isSubmitting}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-[2] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Registrando...' : 'Cadastrar Colaborador'}
        </Button>
      </div>
    </form>
  );
}