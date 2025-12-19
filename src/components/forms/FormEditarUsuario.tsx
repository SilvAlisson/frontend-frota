import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
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

// --- SCHEMA ZOD V4 ---
const editarUsuarioSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" }).min(3).transform(val => val.trim()),
  email: z.string().email().toLowerCase(),
  matricula: z.string().optional().or(z.literal('')),
  role: z.enum(ROLES),
  cargoId: z.string().optional().or(z.literal('')),
  cnhNumero: z.string().optional().or(z.literal('')),
  cnhCategoria: z.string().optional().or(z.literal('')),
  cnhValidade: z.string().optional().or(z.literal('')),
  dataAdmissao: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')).refine(val => !val || val.length >= 6, { message: "Nova senha deve ter no mínimo 6 caracteres" })
});

type EditarUsuarioFormInput = z.input<typeof editarUsuarioSchema>;

interface FormEditarUsuarioProps {
  userId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ userId, onSuccess, onCancelar }: FormEditarUsuarioProps) {
  const [loadingData, setLoadingData] = useState(true);

  // Estados para Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fotoAtualUrl, setFotoAtualUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    defaultValues: { nome: '', email: '', matricula: '', role: 'ENCARREGADO', password: '' },
    mode: 'onBlur'
  });

  const roleSelecionada = watch('role');

  // --- FETCH DADOS ---
  useEffect(() => {
    if (!userId) return;
    const fetchUsuario = async () => {
      setLoadingData(true);
      try {
        // CORREÇÃO: Rota no plural (/users)
        const { data: user } = await api.get(`/users/${userId}`);
        const roleValida = ROLES.includes(user.role as any) ? (user.role as typeof ROLES[number]) : 'ENCARREGADO';

        setFotoAtualUrl(user.fotoUrl || null);

        reset({
          nome: user.nome || '',
          email: user.email || '',
          matricula: user.matricula || '',
          role: roleValida,
          password: '',
          cargoId: user.cargoId || '',
          cnhNumero: user.cnhNumero || '',
          cnhCategoria: user.cnhCategoria || '',
          cnhValidade: user.cnhValidade ? user.cnhValidade.split('T')[0] : '',
          dataAdmissao: user.dataAdmissao ? user.dataAdmissao.split('T')[0] : '',
        });
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados.");
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };
    fetchUsuario();
  }, [userId, reset, onCancelar]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<EditarUsuarioFormInput> = async (data) => {
    const isOperador = data.role === 'OPERADOR';
    let finalFotoUrl = fotoAtualUrl;

    // 1. Upload Nova Foto (apenas se selecionada)
    if (fotoFile) {
      try {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `perfil-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `perfis/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos-frota')
          .upload(filePath, fotoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-frota')
          .getPublicUrl(uploadData.path);

        finalFotoUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error(err);
        toast.error("Erro ao atualizar foto.");
        return;
      }
    }

    const dataToUpdate: any = {
      nome: DOMPurify.sanitize(data.nome),
      email: DOMPurify.sanitize(data.email),
      matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
      role: data.role,
      fotoUrl: finalFotoUrl,

      cargoId: isOperador && data.cargoId ? data.cargoId : null,
      cnhNumero: isOperador && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOperador && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOperador && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
    };

    if (data.password && data.password.trim() !== '') {
      dataToUpdate.password = data.password;
    }

    // CORREÇÃO: Rota no plural (/users)
    const promise = api.put(`/users/${userId}`, dataToUpdate);

    toast.promise(promise, {
      loading: 'Salvando alterações...',
      success: () => {
        setTimeout(onSuccess, 800);
        return 'Perfil atualizado com sucesso!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao atualizar.';
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
        <p className="text-sm text-gray-500 font-medium animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center relative">

        {/* Avatar Uploader */}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        <div
          className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-all relative group overflow-hidden mb-3 ring-2 ring-indigo-50"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl || fotoAtualUrl ? (
            <img src={previewUrl || fotoAtualUrl!} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
        </div>

        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Colaborador</h4>
        <p className="text-sm text-text-secondary text-center">Atualize dados e foto de perfil.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
        <div className="md:col-span-2"><Input label="Nome Completo" {...register('nome')} error={errors.nome?.message} disabled={isSubmitting} /></div>
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} disabled={isSubmitting} />
        <Input label="Matrícula" {...register('matricula')} error={errors.matricula?.message} disabled={isSubmitting} />
        <div className="relative group">
          <Input label="Alterar Senha" type="password" placeholder="(Opcional)" {...register('password')} error={errors.password?.message} disabled={isSubmitting} />
          <span className="absolute right-0 top-0 text-[10px] text-gray-400 font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">Nova Senha</span>
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função</label>
          <div className="relative">
            <select className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400" {...register('role')} disabled={isSubmitting}>
              {ROLES.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
          </div>
          {errors.role && <p className="text-xs text-error mt-1">{errors.role.message}</p>}
        </div>
      </div>

      {/* SEÇÃO RH */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${roleSelecionada === 'OPERADOR' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-50'}`}>
        <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Dados Funcionais (RH)
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-colors hover:border-indigo-100">
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Cargo</label>
              <div className="relative">
                <select className="w-full px-4 py-2 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm" {...register('cargoId')} disabled={isSubmitting || isLoadingCargos}>
                  <option value="">Selecione o cargo...</option>
                  {cargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
              </div>
            </div>
            <div className="md:col-span-1"><Input label="Nº CNH" placeholder="Registro CNH" {...register('cnhNumero')} disabled={isSubmitting} className="bg-white" /></div>
            <div className="md:col-span-1">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Categoria" placeholder="AE" {...register('cnhCategoria')} disabled={isSubmitting} className="bg-white text-center uppercase" maxLength={2} />
                <Input label="Validade CNH" type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-white" />
              </div>
            </div>
            <div className="md:col-span-2"><Input label="Data de Admissão" type="date" {...register('dataAdmissao')} disabled={isSubmitting} className="bg-white" /></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
        <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" variant="primary" className="flex-[2] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}