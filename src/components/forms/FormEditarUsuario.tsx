import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useQuery } from '@tanstack/react-query';

// Interface para Cargo
interface Cargo {
  id: string;
  nome: string;
}

// Constante com todas as funções do sistema
const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// --- ZOD V4 SCHEMA ---
const editarUsuarioSchema = z.object({
  nome: z.string().min(3, { error: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ error: "Email inválido" }),
  matricula: z.union([z.string().optional(), z.literal('')]),
  
  role: z.enum(ROLES, {
    error: "Selecione uma função válida"
  }),

  // Campos Opcionais de RH
  cargoId: z.string().optional().or(z.literal('')),
  cnhNumero: z.string().optional().or(z.literal('')),
  cnhCategoria: z.string().optional().or(z.literal('')),
  cnhValidade: z.string().optional().or(z.literal('')),
  dataAdmissao: z.string().optional().or(z.literal('')),

  // Refine atualizado com lógica segura para senha opcional
  password: z.string().optional().or(z.literal('')).refine(val => !val || val.length >= 6, {
    message: "A nova senha deve ter no mínimo 6 caracteres"
  })
});

type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

interface FormEditarUsuarioProps {
  userId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ userId, onSuccess, onCancelar }: FormEditarUsuarioProps) {

  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Busca de Cargos para o select
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
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      matricula: '',
      role: 'ENCARREGADO',
      password: '',
      cargoId: '',
      cnhNumero: '',
      cnhCategoria: '',
      cnhValidade: '',
      dataAdmissao: ''
    }
  });

  const roleSelecionada = watch('role');

  useEffect(() => {
    if (!userId) return;

    const fetchUsuario = async () => {
      setLoadingData(true);
      try {
        const response = await api.get(`/user/${userId}`);
        const user = response.data;

        // Validação mais robusta da role vinda do banco
        const roleValida = ROLES.includes(user.role as any)
          ? (user.role as typeof ROLES[number])
          : 'ENCARREGADO';

        reset({
          nome: user.nome || '',
          email: user.email || '',
          matricula: user.matricula || '',
          role: roleValida,
          password: '',
          // Campos de RH
          cargoId: user.cargoId || '',
          cnhNumero: user.cnhNumero || '',
          cnhCategoria: user.cnhCategoria || '',
          // Formata datas ISO para YYYY-MM-DD do input date
          cnhValidade: user.cnhValidade ? user.cnhValidade.split('T')[0] : '',
          dataAdmissao: user.dataAdmissao ? user.dataAdmissao.split('T')[0] : '',
        });

      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        setError('root', { message: 'Falha ao carregar os dados do colaborador.' });
      } finally {
        setLoadingData(false);
      }
    };

    fetchUsuario();
  }, [userId, reset, setError]);

  const onSubmit: SubmitHandler<EditarUsuarioForm> = async (data) => {
    setSuccessMsg('');
    try {
      const dataToUpdate: any = {
        nome: DOMPurify.sanitize(data.nome),
        email: DOMPurify.sanitize(data.email),
        matricula: data.matricula && data.matricula.trim() !== ''
          ? DOMPurify.sanitize(data.matricula)
          : null,
        role: data.role,
        // Campos de RH
        cargoId: data.cargoId || null,
        cnhNumero: data.cnhNumero || null,
        cnhCategoria: data.cnhCategoria || null,
        cnhValidade: data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
        dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
      };

      if (data.password && data.password.trim() !== '') {
        dataToUpdate.password = data.password;
      }

      await api.put(`/user/${userId}`, dataToUpdate);

      setSuccessMsg('Integrante atualizado com sucesso!');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao atualizar usuário:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao atualizar usuário.' });
      }
    }
  };

  // Função auxiliar para renderizar o nome amigável da função
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
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">Carregando dados do integrante...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Editar Colaborador
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          Atualize os dados de acesso e perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          label="Matrícula (Opcional)"
          {...register('matricula')}
          error={errors.matricula?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Nova Senha"
          type="password"
          placeholder="(Deixe em branco para manter)"
          {...register('password')}
          error={errors.password?.message}
          disabled={isSubmitting}
        />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função (Role)</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
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
          {errors.role && <p className="mt-1 text-xs text-error">{errors.role.message}</p>}
        </div>
      </div>

      {/* SEÇÃO DE RH (EXIBIR APENAS SE FOR OPERADOR) */}
      {/* Se quiser que apareça para todos, remova a condição roleSelecionada === 'OPERADOR' */}
      {roleSelecionada === 'OPERADOR' && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
            Dados Funcionais (RH)
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">Cargo / Função</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
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
              {isLoadingCargos && <p className="text-xs text-primary mt-1">Carregando cargos...</p>}
            </div>

            <div className="md:col-span-1">
              <Input
                label="Nº CNH"
                placeholder="Registro CNH"
                {...register('cnhNumero')}
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-1">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Categoria"
                  placeholder="AE"
                  {...register('cnhCategoria')}
                  disabled={isSubmitting}
                />
                <Input
                  label="Validade CNH"
                  type="date"
                  {...register('cnhValidade')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <Input
                label="Data de Admissão"
                type="date"
                {...register('dataAdmissao')}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{errors.root.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
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
          className="flex-1"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}