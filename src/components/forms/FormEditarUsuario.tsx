import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
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

// --- SCHEMA ---
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

// Tipos Seguros
type EditarUsuarioFormInput = z.input<typeof editarUsuarioSchema>;
type EditarUsuarioFormOutput = z.output<typeof editarUsuarioSchema>;

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

  // [CORREÇÃO] Tipagem completa do useForm
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EditarUsuarioFormInput, any, EditarUsuarioFormOutput>({
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

  const onSubmit = async (data: EditarUsuarioFormOutput) => {
    const isOperador = data.role === 'OPERADOR';
    let finalFotoUrl = fotoAtualUrl;

    // Upload Foto
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

    const promise = api.put(`/users/${userId}`, dataToUpdate);

    toast.promise(promise, {
      loading: 'Salvando alterações...',
      success: () => {
        setTimeout(onSuccess, 800);
        return 'Perfil atualizado!';
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

  // --- ESTILOS PADRONIZADOS ---
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  if (loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary"></div>
        <p className="text-sm text-gray-400 font-medium mt-4 animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Colaborador</h3>
          <p className="text-xs text-gray-500">Atualize dados de acesso e perfil.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
      </div>

      <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>

        {/* AVATAR */}
        <div className="flex flex-col items-center">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform relative group overflow-hidden ring-1 ring-border"
          >
            {previewUrl || fotoAtualUrl ? (
              <img src={previewUrl || fotoAtualUrl!} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-[10px] font-bold uppercase tracking-wide">Alterar</span>
            </div>
          </div>
          <p className="text-xs text-primary font-medium mt-2 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
            {previewUrl ? 'Trocar Foto' : 'Adicionar Foto'}
          </p>
        </div>

        {/* DADOS GERAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelStyle}>Nome Completo</label>
            <Input {...register('nome')} error={errors.nome?.message} disabled={isSubmitting} />
          </div>

          <div>
            <label className={labelStyle}>Email</label>
            <Input type="email" {...register('email')} error={errors.email?.message} disabled={isSubmitting} />
          </div>

          <div>
            <label className={labelStyle}>Matrícula</label>
            <Input {...register('matricula')} error={errors.matricula?.message} disabled={isSubmitting} />
          </div>

          <div>
            <label className={labelStyle}>Nova Senha (Opcional)</label>
            <Input type="password" placeholder="******" {...register('password')} error={errors.password?.message} disabled={isSubmitting} />
          </div>

          <div>
            <label className={labelStyle}>Função</label>
            <div className="relative">
              <select className={selectStyle} {...register('role')} disabled={isSubmitting}>
                {ROLES.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
          </div>
        </div>

        {/* SEÇÃO RH (Condicional) */}
        <div className={`transition-all duration-300 overflow-hidden ${roleSelecionada === 'OPERADOR' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mt-2">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-100">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Dados de Habilitação & Cargo</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelStyle}>Cargo Oficial</label>
                <div className="relative">
                  <select className={selectStyle} {...register('cargoId')} disabled={isSubmitting || isLoadingCargos}>
                    <option value="">Selecione o cargo...</option>
                    {cargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                </div>
              </div>

              <div><Input label="Nº CNH" placeholder="Registro" {...register('cnhNumero')} disabled={isSubmitting} className="bg-white" /></div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Cat." placeholder="AE" {...register('cnhCategoria')} disabled={isSubmitting} className="bg-white text-center uppercase" maxLength={2} />
                <Input label="Validade" type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-white" />
              </div>

              <div className="md:col-span-2">
                <Input label="Data de Admissão" type="date" {...register('dataAdmissao')} disabled={isSubmitting} className="bg-white" />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 pt-6 border-t border-border">
          <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" variant="primary" className="flex-[2] shadow-lg shadow-primary/20" disabled={isSubmitting} isLoading={isSubmitting}>
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}