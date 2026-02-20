import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../supabaseClient'; 
import { useCreateDocumento } from '../../hooks/useDocumentosLegais';
import { useVeiculos } from '../../hooks/useVeiculos'; 
import { toast } from 'sonner';
import { UploadCloud, FileText, Calendar, Truck, Save, AlertTriangle, Loader2, Info } from 'lucide-react';

// Componentes UI
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

// Schema
const docSchema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres"),
  descricao: z.string().optional(),
  categoria: z.string().min(1, "Selecione uma categoria"),
  dataValidade: z.string().optional(), 
  tipoVeiculo: z.string().optional(),
  veiculoId: z.string().optional(),
});

type DocFormInput = z.input<typeof docSchema>;
type DocFormOutput = z.output<typeof docSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancel: () => void;
  veiculoIdPreSelecionado?: string;
}

export function FormCadastrarDocumento({ onSuccess, onCancel, veiculoIdPreSelecionado }: FormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { mutate: criarDocumento, isPending } = useCreateDocumento();
  const { data: veiculos } = useVeiculos(); 

  const tiposDisponiveis = useMemo(() => {
    if (!veiculos) return [];
    const tipos = veiculos
      .map(v => v.tipoVeiculo)
      .filter((t): t is string => !!t);
    return Array.from(new Set(tipos)).sort();
  }, [veiculos]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DocFormInput, any, DocFormOutput>({
    resolver: zodResolver(docSchema),
    defaultValues: { 
      titulo: '',
      descricao: '',
      categoria: '',
      tipoVeiculo: '',
      dataValidade: '',
      veiculoId: veiculoIdPreSelecionado || '' 
    },
    mode: 'onBlur'
  });

  useEffect(() => {
    if (veiculoIdPreSelecionado) {
      setValue('veiculoId', veiculoIdPreSelecionado);
      setValue('tipoVeiculo', ''); 
    }
  }, [veiculoIdPreSelecionado, setValue]);

  const veiculoIdSelecionado = watch('veiculoId');
  const categoriaSelecionada = watch('categoria');

  const handleUploadAndSubmit = async (data: DocFormOutput) => {
    if (!file) {
      toast.error("Por favor, selecione um arquivo PDF ou Imagem.");
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documentos-legais/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath);

      criarDocumento({
        titulo: data.titulo,
        descricao: data.descricao,
        categoria: data.categoria,
        arquivoUrl: publicUrl,
        tipoVeiculo: data.tipoVeiculo || undefined,
        veiculoId: data.veiculoId || undefined, 
        dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
      }, {
        onSuccess: () => onSuccess()
      });

    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  // Mapeamento de opções para os Selects
  const categoriasOptions = [
    { value: "AST", label: "⚠️ AST (Análise de Segurança)" },
    { value: "LICENCA_AMBIENTAL", label: "Licença Ambiental (Global)" },
    { value: "ATRP", label: "ATRP (Global)" },
    { value: "OUTROS_GLOBAIS", label: "Outros (Global)" },
    { value: "CRLV", label: "CRLV (Veículo)" },
    { value: "CIV", label: "CIV (Veículo)" },
    { value: "CIPP", label: "CIPP (Veículo)" },
    { value: "LAUDO_CHAPA", label: "Laudo de Chapa (Veículo)" },
    { value: "TACOGRAFO", label: "Tacógrafo (Veículo)" },
    { value: "MANUTENCAO", label: "Relatório de Manutenção (Veículo)" },
  ];

  const tiposVeiculoOptions = [
    { value: "", label: "Aplicar a Todos" },
    ...tiposDisponiveis.map(t => ({ value: t, label: t })),
    ...(!tiposDisponiveis.length ? [
      { value: "CAMINHAO", label: "Caminhões" },
      { value: "CARRO", label: "Carros Leves" }
    ] : [])
  ];

  const veiculosOptions = [
    { value: "", label: "Nenhum Veículo Específico" },
    ...(veiculos?.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })) || [])
  ];

  const isFormLocked = uploading || isPending;

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
      
      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <FileText className="w-5 h-5" />
            </div>
            Novo Documento
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Upload seguro de ficheiros e licenças legais.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleUploadAndSubmit)} className="flex flex-col flex-1 min-h-0">
        
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* ÁREA DE UPLOAD */}
          <div className="space-y-2">
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                  Anexo Principal
              </label>
              <div className={`
                border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group overflow-hidden
                ${file ? 'border-success/50 bg-success/5 shadow-inner' : 'border-border/60 bg-background/30 hover:bg-surface hover:border-primary/50'}
                ${isFormLocked ? 'opacity-50 pointer-events-none' : ''}
              `}>
                <input
                  type="file"
                  id="doc-upload"
                  accept=".pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={isFormLocked}
                />
                
                <div className="flex flex-col items-center pointer-events-none relative z-0">
                  <div className={`p-4 rounded-full mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${file ? 'bg-success/10 text-success' : 'bg-surface border border-border/60 text-text-muted group-hover:text-primary group-hover:border-primary/20'}`}>
                    {file ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                  </div>
                  
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-black text-text-main break-all max-w-[280px] mx-auto line-clamp-2">{file.name}</p>
                      <p className="text-xs text-success font-bold uppercase tracking-wider">Ficheiro selecionado</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-text-main">Arraste um ficheiro ou clique para procurar</p>
                      <p className="text-xs text-text-secondary font-medium">Tamanho máximo: 5MB (PDF, JPG, PNG)</p>
                    </div>
                  )}
                </div>
              </div>
          </div>

          <div className="border-t border-border/50 pt-6 space-y-6">
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
                <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Metadados do Documento</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Input 
                  label="Título Identificador" 
                  {...register('titulo')} 
                  error={errors.titulo?.message} 
                  placeholder="Ex: AST 001 - Regras de Segurança" 
                  disabled={isFormLocked}
                  className="font-bold text-text-main"
                  autoFocus
                />
              </div>

              <div>
                <Select
                  label="Classificação (Categoria)"
                  options={categoriasOptions}
                  {...register('categoria')}
                  error={errors.categoria?.message}
                  disabled={isFormLocked}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <div>
                <Input 
                    label="Válido até" 
                    type="date" 
                    icon={<Calendar className="w-4 h-4 text-primary/70" />}
                    {...register('dataValidade')} 
                    disabled={isFormLocked} 
                />
              </div>

              <div className={veiculoIdPreSelecionado ? 'opacity-40 pointer-events-none grayscale' : ''}>
                <Select
                  label="Restringir por Tipo"
                  options={tiposVeiculoOptions}
                  icon={<Truck className="w-4 h-4 text-text-muted" />}
                  {...register('tipoVeiculo')}
                  disabled={!!veiculoIdSelecionado || isFormLocked}
                  error={errors.tipoVeiculo?.message}
                  containerClassName={categoriaSelecionada === 'AST' ? 'ring-2 ring-warning-500/20 rounded-xl bg-warning-500/5 p-1' : ''}
                />
                {categoriaSelecionada === 'AST' && (
                  <p className="text-[10px] text-warning-600 mt-1.5 font-bold flex items-center gap-1 pl-1">
                    <AlertTriangle className="w-3 h-3" /> Tipo recomendado para AST
                  </p>
                )}
              </div>

              <div>
                <Select
                  label="Vincular a Placa Específica"
                  options={veiculosOptions}
                  {...register('veiculoId')}
                  onChange={(e: any) => {
                    setValue('veiculoId', e.target.value);
                    if (e.target.value) setValue('tipoVeiculo', '');
                  }}
                  disabled={!!veiculoIdPreSelecionado || isFormLocked}
                  error={errors.veiculoId?.message}
                />
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">
                <Info className="w-3.5 h-3.5" /> Detalhes ou Observações
              </label>
              <textarea
                {...register('descricao')}
                disabled={isFormLocked}
                className="w-full px-4 py-3 text-sm text-text-main bg-surface border border-border/60 rounded-xl transition-all duration-300 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-text-muted disabled:bg-background/50 disabled:cursor-not-allowed resize-none shadow-sm h-24"
                placeholder="Insira detalhes adicionais sobre as regras deste documento..."
              />
            </div>
          </div>
        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            disabled={isFormLocked}
            className="w-full sm:w-auto font-bold"
          >
            Descartar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isFormLocked}
            icon={uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} // 🔥 CORRIGIDO AQUI: leftIcon -> icon
            className="w-full sm:w-auto shadow-button hover:shadow-float-primary px-10 font-black uppercase tracking-tight"
          >
            {uploading ? 'Enviando Ficheiro...' : 'Arquivar Documento'}
          </Button>
        </div>

      </form>
    </div>
  );
}