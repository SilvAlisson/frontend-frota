import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../supabaseClient'; 
import { useCreateDocumento } from '../../hooks/useDocumentosLegais';
import { useVeiculos } from '../../hooks/useVeiculos'; 
import { toast } from 'sonner';
import { UploadCloud, FileText, Calendar, Truck, Save, AlertTriangle } from 'lucide-react';

// Componentes UI
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Schema
const docSchema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres"),
  descricao: z.string().optional(),
  categoria: z.string().min(1, "Selecione uma categoria"),
  dataValidade: z.string().optional(), 
  tipoVeiculo: z.string().optional(),
  veiculoId: z.string().optional(),
});

type DocFormValues = z.infer<typeof docSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormCadastrarDocumento({ onSuccess, onCancel }: FormProps) {
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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DocFormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: { categoria: '' }
  });

  const veiculoIdSelecionado = watch('veiculoId');
  const categoriaSelecionada = watch('categoria');

  const handleUploadAndSubmit = async (data: DocFormValues) => {
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
        .upload(filePath, file);

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

  // Classes comuns para inputs (evitando hardcode)
  const inputClasses = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm focus:border-primary outline-none text-text-main placeholder:text-text-muted transition-all disabled:bg-background disabled:text-text-muted";
  const labelClasses = "flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-1.5 ml-1";

  return (
    <div className="bg-surface rounded-xl shadow-lg border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">
      
      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Novo Documento</h3>
          <p className="text-xs text-text-secondary">Faça upload de documentos legais ou técnicos.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(handleUploadAndSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* ÁREA DE UPLOAD */}
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-background hover:border-primary/50 transition-all cursor-pointer relative group">
            <input
              type="file"
              id="doc-upload"
              accept=".pdf,image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="flex flex-col items-center pointer-events-none">
              <div className={`p-4 rounded-full mb-3 transition-colors ${file ? 'bg-success/10 text-success' : 'bg-primary/5 text-primary group-hover:bg-primary/10'}`}>
                {file ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
              </div>
              
              {file ? (
                <>
                  <span className="text-sm font-bold text-text-main break-all max-w-[250px]">{file.name}</span>
                  <span className="text-xs text-success font-medium mt-1">Arquivo selecionado</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-text-main">Clique ou arraste o arquivo aqui</span>
                  <span className="text-xs text-text-secondary mt-1">PDF, JPG ou PNG (Máx 5MB)</span>
                </>
              )}
            </div>
          </div>

          {/* CAMPOS PRINCIPAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input 
                label="Título do Documento" 
                {...register('titulo')} 
                error={errors.titulo?.message} 
                placeholder="Ex: AST 001 - Operação Padrão" 
                disabled={uploading || isPending}
              />
            </div>

            <div>
              <label className={labelClasses}>Categoria</label>
              <div className="relative">
                <select
                  {...register('categoria')}
                  disabled={uploading || isPending}
                  className={inputClasses}
                >
                  <option value="">Selecione...</option>
                  <option value="AST">⚠️ AST (Análise de Segurança)</option>
                  <optgroup label="Globais (Empresa)">
                    <option value="LICENCA_AMBIENTAL">Licença Ambiental</option>
                    <option value="ATRP">ATRP</option>
                    <option value="OUTROS_GLOBAIS">Outros</option>
                  </optgroup>
                  <optgroup label="Específicos do Veículo">
                    <option value="CRLV">CRLV</option>
                    <option value="CIV">CIV</option>
                    <option value="CIPP">CIPP</option>
                    <option value="LAUDO_CHAPA">Laudo de Chapa</option>
                    <option value="TACOGRAFO">Tacógrafo</option>
                    <option value="MANUTENCAO">Manutenção (Relatório)</option>
                  </optgroup>
                </select>
              </div>
              {errors.categoria && <p className="text-[10px] text-error mt-1 ml-1">{errors.categoria.message}</p>}
            </div>
          </div>

          {/* CAMPOS CONDICIONAIS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}><Calendar className="w-3 h-3" /> Validade</label>
              <Input type="date" {...register('dataValidade')} disabled={uploading || isPending} containerClassName="!mb-0" />
            </div>

            <div>
              <label className={labelClasses}><Truck className="w-3 h-3" /> Tipo Veículo</label>
              <select
                {...register('tipoVeiculo')}
                disabled={!!veiculoIdSelecionado || uploading || isPending}
                className={`${inputClasses} ${categoriaSelecionada === 'AST' ? 'border-warning-500/50 bg-warning-500/5' : ''}`}
              >
                <option value="">Aplicar a Todos</option>
                {tiposDisponiveis.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
                {!tiposDisponiveis.length && (
                  <>
                    <option value="CAMINHAO">Caminhões</option>
                    <option value="CARRO">Carros Leves</option>
                  </>
                )}
              </select>
              
              {categoriaSelecionada === 'AST' && (
                <p className="text-[10px] text-warning-600 mt-1 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Restringir AST por tipo?
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Placa Específica</label>
              <select
                {...register('veiculoId')}
                onChange={(e) => {
                  setValue('veiculoId', e.target.value);
                  if (e.target.value) setValue('tipoVeiculo', '');
                }}
                disabled={uploading || isPending}
                className={inputClasses}
              >
                <option value="">Nenhuma</option>
                {veiculos?.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className={labelClasses}>Descrição / Observações</label>
            <textarea
              {...register('descricao')}
              disabled={uploading || isPending}
              className={`${inputClasses} h-24 py-2 resize-none`}
              placeholder="Detalhes adicionais sobre este documento..."
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading || isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={uploading || isPending}
            icon={<Save className="w-4 h-4" />}
            className="shadow-button hover:shadow-float px-6"
          >
            {uploading ? 'Enviando...' : 'Salvar Documento'}
          </Button>
        </div>

      </form>
    </div>
  );
}