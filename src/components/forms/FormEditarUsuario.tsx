import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { User, Mail, Hash, Lock, Shield, Briefcase, Calendar, Camera, Save, Loader2, CreditCard } from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 

interface Cargo {
  id: string;
  nome: string;
}

const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const editarUsuarioSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" }).min(3).transform(val => val.trim()),
  email: z.string().email().toLowerCase(),
  matricula: z.string().optional().nullable(),
  role: z.enum(ROLES),
  cargoId: z.string().optional().nullable(),
  cnhNumero: z.string().optional().nullable(),
  cnhCategoria: z.string().optional().nullable(),
  cnhValidade: z.string().optional().nullable(),
  dataAdmissao: z.string().optional().nullable(),
  password: z.string().optional().nullable().refine(val => !val || val.length >= 6, { message: "Nova senha deve ter no mínimo 6 caracteres" })
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
    control,
    formState: { errors, isSubmitting }
  } = useForm<EditarUsuarioFormInput, any, EditarUsuarioFormOutput>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: { nome: '', email: '', matricula: '', role: 'ENCARREGADO', password: '' },
    mode: 'onBlur'
  });

  const roleSelecionada = useWatch({ control, name: 'role' });

  // Mapeamento seguro de Roles
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
    let isMounted = true;

    const carregarTudo = async () => {
      setLoadingData(true);
      try {
        const [userData, cargosData] = await Promise.all([
          api.get(`/users/${userId}`),
          api.get('/cargos')
        ]);

        if (!isMounted) return;

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
          // Corrige datas para inputs de formato date HTML (YYYY-MM-DD)
          cnhValidade: user.cnhValidade ? user.cnhValidade.split('T')[0] : '',
          dataAdmissao: user.dataAdmissao ? user.dataAdmissao.split('T')[0] : '',
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
            toast.error("Erro ao carregar os dados de perfil.");
            onCancelar();
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };
    
    carregarTudo();
    return () => { isMounted = false; };
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
        toast.error("Erro ao atualizar foto de perfil.");
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
      loading: 'A guardar alterações...',
      success: () => {
        setTimeout(onSuccess, 800);
        return 'Perfil do colaborador atualizado!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao atualizar dados.';
      }
    });
  };

  const isLocked = isSubmitting || loadingData;

  if (loadingData) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">A extrair dados do Perfil...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <User className="w-6 h-6" />
            </div>
            Editar Colaborador
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Atualize informações de acesso e credenciais profissionais.</p>
        </div>
      </div>

      <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit(onSubmit)}>
        
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">

          {/* AVATAR UPLOAD (Redesenhado) */}
          <div className="flex flex-col items-center mb-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} disabled={isLocked} />
            <div
              onClick={() => !isLocked && fileInputRef.current?.click()}
              className={`w-28 h-28 rounded-full bg-surface-hover border-4 border-surface shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all relative group overflow-hidden ring-2 ring-border/50 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Alterar foto de perfil"
            >
              {previewUrl || fotoAtualUrl ? (
                <img src={previewUrl || fotoAtualUrl!} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <User className="w-12 h-12 opacity-40 group-hover:scale-110 transition-transform" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Mudar Foto</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            
            <div className="md:col-span-2 flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Dados Pessoais e Acesso</label>
            </div>

            <div className="md:col-span-2">
              <Input 
                label="Nome Completo" 
                icon={<User className="w-4 h-4 text-text-muted"/>} 
                {...register('nome')} 
                error={errors.nome?.message} 
                disabled={isLocked} 
              />
            </div>

            <div>
              <Input 
                label="E-mail Corporativo" 
                type="email" 
                icon={<Mail className="w-4 h-4 text-text-muted"/>} 
                {...register('email')} 
                error={errors.email?.message} 
                disabled={isLocked} 
              />
            </div>

            <div className="relative">
              <Input 
                label="Mudar Senha (Opcional)" 
                type="password" 
                placeholder="Introduza a nova senha" 
                icon={<Lock className="w-4 h-4 text-text-muted"/>} 
                {...register('password')} 
                error={errors.password?.message} 
                disabled={isLocked} 
              />
              <span className="absolute right-3 top-3 text-[10px] text-text-muted font-bold pointer-events-none opacity-60">Mín. 6 chars</span>
            </div>

            <div>
              <Input 
                label="Matrícula Interna" 
                icon={<Hash className="w-4 h-4 text-text-muted"/>} 
                {...register('matricula')} 
                error={errors.matricula?.message} 
                disabled={isLocked} 
              />
            </div>

            <div>
              <Select 
                label="Nível de Acesso (Função)" 
                options={roleOptions} 
                icon={<Shield className="w-4 h-4 text-text-muted"/>}
                {...register('role')} 
                error={errors.role?.message} 
                disabled={isLocked} 
              />
            </div>
          </div>

          {/* SEÇÃO RH CONDICIONAL (MOTORISTAS) */}
          <div className={`transition-all duration-500 overflow-hidden ${roleSelecionada === 'OPERADOR' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 m-0 p-0 border-0'}`}>
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-2 mb-5 border-b border-primary/10 pb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg text-primary shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.15em]">Documentação (RH e Operacional)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Select 
                    label="Cargo Profissional" 
                    options={cargoOptions}
                    icon={<Briefcase className="w-4 h-4 text-text-muted"/>}
                    {...register('cargoId')} 
                    disabled={isLocked} 
                  />
                </div>

                <div>
                  <Input 
                    label="Nº da CNH" 
                    placeholder="Registro" 
                    icon={<CreditCard className="w-4 h-4 text-primary/70"/>} 
                    {...register('cnhNumero')} 
                    disabled={isLocked} 
                    className="font-mono tracking-wider" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input 
                        label="Categoria" 
                        placeholder="AE" 
                        {...register('cnhCategoria')} 
                        disabled={isLocked} 
                        className="text-center font-black text-lg uppercase text-primary tracking-widest" 
                        maxLength={2} 
                    />
                  </div>
                  <div>
                    <Input 
                        label="Validade CNH" 
                        type="date" 
                        {...register('cnhValidade')} 
                        disabled={isLocked} 
                        className="text-sm text-text-secondary" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Data de Admissão (Contrato)" 
                    type="date" 
                    icon={<Calendar className="w-4 h-4 text-primary/70"/>} 
                    {...register('dataAdmissao')} 
                    disabled={isLocked} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full sm:w-auto font-bold" 
            disabled={isLocked} 
            onClick={onCancelar}
          >
            Descartar Alterações
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full sm:w-auto shadow-button hover:shadow-float-primary px-10 font-black uppercase tracking-tight" 
            disabled={isLocked} 
            isLoading={isLocked}
            icon={<Save className="w-4 h-4"/>}
          >
            Salvar Perfil
          </Button>
        </div>

      </form>
    </div>
  );
}