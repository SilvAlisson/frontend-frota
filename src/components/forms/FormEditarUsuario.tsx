import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { User, Mail, Hash, Lock, Shield, Briefcase, FileText, Calendar, Camera } from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 

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

type EditarUsuarioFormInput = z.input<typeof editarUsuarioSchema>;
type EditarUsuarioFormOutput = z.output<typeof editarUsuarioSchema>;

interface FormEditarUsuarioProps {
  userId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ userId, onSuccess, onCancelar }: FormEditarUsuarioProps) {
  const [loadingData, setLoadingData] = useState(true);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  // Estados para Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fotoAtualUrl, setFotoAtualUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // [CORREÇÃO] Mapeamento seguro de Roles
  const roleOptions = useMemo(() => {
    const labels: Record<string, string> = {
      'OPERADOR': 'Motorista (Operador)',
      'ENCARREGADO': 'Gestor (Encarregado)',
      'RH': 'Recursos Humanos (RH)',
      'COORDENADOR': 'Coordenador',
      'ADMIN': 'Administrador'
    };
    
    return ROLES.map(role => ({
      value: role,
      label: labels[role] || role
    }));
  }, []);

  // Mapeamento de Cargos para o Select
  const cargoOptions = useMemo(() => cargos.map(c => ({
    value: c.id,
    label: c.nome
  })), [cargos]);

  // --- FETCH DADOS ---
  useEffect(() => {
    if (!userId) return;

    const carregarTudo = async () => {
      setLoadingData(true);
      try {
        const [userData, cargosData] = await Promise.all([
          api.get(`/users/${userId}`),
          api.get('/cargos')
        ]);

        setCargos(cargosData.data);
        const user = userData.data;
        // Garante que a role vinda do banco é válida no nosso Enum
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
    
    carregarTudo();
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

  // [CORREÇÃO] Removida variável 'labelStyle' não utilizada

  if (loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary"></div>
        <p className="text-sm text-gray-400 font-medium mt-4 animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Colaborador</h3>
          <p className="text-xs text-gray-500">Atualize dados de acesso e perfil.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <User className="w-5 h-5" />
        </div>
      </div>

      <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleSubmit(onSubmit)}>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* AVATAR */}
          <div className="flex flex-col items-center">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} disabled={isSubmitting} />

            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform relative group overflow-hidden ring-1 ring-border ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {previewUrl || fotoAtualUrl ? (
                <img src={previewUrl || fotoAtualUrl!} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-primary font-medium mt-2 cursor-pointer hover:underline" onClick={() => !isSubmitting && fileInputRef.current?.click()}>
              {previewUrl ? 'Trocar Foto' : 'Adicionar Foto'}
            </p>
          </div>

          {/* DADOS GERAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input label="Nome Completo" icon={<User className="w-4 h-4"/>} {...register('nome')} error={errors.nome?.message} disabled={isSubmitting} />
            </div>

            <div>
              <Input label="Email" type="email" icon={<Mail className="w-4 h-4"/>} {...register('email')} error={errors.email?.message} disabled={isSubmitting} />
            </div>

            <div>
              <Input label="Matrícula" icon={<Hash className="w-4 h-4"/>} {...register('matricula')} error={errors.matricula?.message} disabled={isSubmitting} />
            </div>

            <div>
              <Input label="Nova Senha (Opcional)" type="password" placeholder="******" icon={<Lock className="w-4 h-4"/>} {...register('password')} error={errors.password?.message} disabled={isSubmitting} />
            </div>

            <div>
              <Select 
                label="Função" 
                options={roleOptions} 
                icon={<Shield className="w-4 h-4"/>}
                {...register('role')} 
                error={errors.role?.message} 
                disabled={isSubmitting} 
              />
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
                  <Select 
                    label="Cargo Oficial" 
                    options={cargoOptions}
                    icon={<Briefcase className="w-4 h-4"/>}
                    {...register('cargoId')} 
                    disabled={isSubmitting} 
                  />
                </div>

                <div>
                  <Input label="Nº CNH" placeholder="Registro" icon={<FileText className="w-4 h-4"/>} {...register('cnhNumero')} disabled={isSubmitting} className="bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Cat." placeholder="AE" {...register('cnhCategoria')} disabled={isSubmitting} className="bg-white text-center uppercase" maxLength={2} />
                  <Input label="Validade" type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-white" />
                </div>

                <div className="md:col-span-2">
                  <Input label="Data de Admissão" type="date" icon={<Calendar className="w-4 h-4"/>} {...register('dataAdmissao')} disabled={isSubmitting} className="bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 p-4 border-t border-border bg-background shrink-0">
          <Button type="button" variant="ghost" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>Cancelar</Button>
          <Button type="submit" variant="primary" className="flex-[2] shadow-button hover:shadow-float" disabled={isSubmitting} isLoading={isSubmitting}>
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}