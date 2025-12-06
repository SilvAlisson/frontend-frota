import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Cargo {
  id: string;
  nome: string;
}

const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// --- SCHEMA ZOD V4 (Edição Segura) ---
const editarUsuarioSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" })
    .min(3, { error: "Nome muito curto" })
    .transform(val => val.trim()),

  email: z.string({ error: "Email é obrigatório" })
    .email({ error: "Formato de email inválido" })
    .toLowerCase(),

  matricula: z.string().optional().or(z.literal('')),

  role: z.enum(ROLES, { error: "Selecione uma função válida" }),

  // Dados RH
  cargoId: z.string().optional().or(z.literal('')),
  cnhNumero: z.string().optional().or(z.literal('')),
  cnhCategoria: z.string().optional().or(z.literal('')),
  cnhValidade: z.string().optional().or(z.literal('')),
  dataAdmissao: z.string().optional().or(z.literal('')),

  // Senha opcional na edição (só valida se preenchido)
  password: z.string().optional().or(z.literal(''))
    .refine(val => !val || val.length >= 6, {
      message: "Nova senha deve ter no mínimo 6 caracteres"
    })
});

type EditarUsuarioFormInput = z.input<typeof editarUsuarioSchema>;

interface FormEditarUsuarioProps {
  userId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ userId, onSuccess, onCancelar }: FormEditarUsuarioProps) {
  const [loadingData, setLoadingData] = useState(true);

  // Cache de cargos (React Query)
  const { data: cargos = [], isLoading: isLoadingCargos } = useQuery<Cargo[]>({
    queryKey: ['cargos-select'],
    queryFn: async () => {
      const response = await api.get('/cargos');
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EditarUsuarioFormInput>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      nome: '', email: '', matricula: '', role: 'ENCARREGADO', password: '',
      cargoId: '', cnhNumero: '', cnhCategoria: '', cnhValidade: '', dataAdmissao: ''
    },
    mode: 'onBlur'
  });

  const roleSelecionada = watch('role');

  // --- FETCH DADOS USUÁRIO ---
  useEffect(() => {
    if (!userId) return;

    const fetchUsuario = async () => {
      setLoadingData(true);
      try {
        const { data: user } = await api.get(`/user/${userId}`);

        const roleValida = ROLES.includes(user.role as any)
          ? (user.role as typeof ROLES[number]) : 'ENCARREGADO';

        reset({
          nome: user.nome || '',
          email: user.email || '',
          matricula: user.matricula || '',
          role: roleValida,
          password: '', // Senha sempre vem vazia
          cargoId: user.cargoId || '',
          cnhNumero: user.cnhNumero || '',
          cnhCategoria: user.cnhCategoria || '',
          cnhValidade: user.cnhValidade ? user.cnhValidade.split('T')[0] : '',
          dataAdmissao: user.dataAdmissao ? user.dataAdmissao.split('T')[0] : '',
        });
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados do usuário.");
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };

    fetchUsuario();
  }, [userId, reset, onCancelar]);

  // --- SUBMIT ---
  const onSubmit: SubmitHandler<EditarUsuarioFormInput> = async (data) => {
    const isOperador = data.role === 'OPERADOR';

    const dataToUpdate: any = {
      nome: DOMPurify.sanitize(data.nome),
      email: DOMPurify.sanitize(data.email),
      matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
      role: data.role,

      cargoId: isOperador && data.cargoId ? data.cargoId : null,
      cnhNumero: isOperador && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOperador && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOperador && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
    };

    // Só envia senha se foi alterada
    if (data.password && data.password.trim() !== '') {
      dataToUpdate.password = data.password;
    }

    const promise = api.put(`/user/${userId}`, dataToUpdate);

    toast.promise(promise, {
      loading: 'Atualizando perfil...',
      success: () => {
        setTimeout(onSuccess, 800);
        return 'Colaborador atualizado com sucesso!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao atualizar. Verifique os dados.';
      }
    });
  };

  const getRoleLabel = (role: typeof ROLES[number]) => {
    switch (role) {
      case 'OPERADOR': return 'Motorista (Operador)';
      case 'ENCARREGADO': return 'Gestor (Encarregado)';
      case 'RH': return 'Recursos Humanos (RH)';
      case 'COORDENADOR': return 'Coordenador';
      case 'ADMIN': return 'Administrador';
      default: return role;
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent rounded-full" />

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm ring-4 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
          Editar Colaborador
        </h4>
        <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
          Atualize os dados de acesso, função e perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
        <div className="md:col-span-2">
          <Input
            label="Nome Completo"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Matrícula"
          {...register('matricula')}
          error={errors.matricula?.message}
          disabled={isSubmitting}
        />

        <div className="relative group">
          <Input
            label="Alterar Senha"
            type="password"
            placeholder="(Opcional)"
            {...register('password')}
            error={errors.password?.message}
            disabled={isSubmitting}
          />
          <span className="absolute right-0 top-0 text-[10px] text-gray-400 font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Nova Senha
          </span>
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
              {...register('role')}
              disabled={isSubmitting}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{getRoleLabel(role)}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
          </div>
          {errors.role && <p className="text-xs text-error mt-1">{errors.role.message}</p>}
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${roleSelecionada === 'OPERADOR' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-50'}`}>
        <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Dados Funcionais
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
              </div>
            </div>

            <div className="md:col-span-1">
              <Input label="Nº CNH" placeholder="Registro CNH" {...register('cnhNumero')} disabled={isSubmitting} className="bg-white" />
            </div>
            <div className="md:col-span-1">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Categoria" placeholder="AE" {...register('cnhCategoria')} disabled={isSubmitting} className="bg-white text-center uppercase" maxLength={2} />
                <Input label="Validade CNH" type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-white" />
              </div>
            </div>
            <div className="md:col-span-2">
              <Input label="Data de Admissão" type="date" {...register('dataAdmissao')} disabled={isSubmitting} className="bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
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
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}