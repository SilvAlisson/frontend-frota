import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../supabaseClient'; 
import { useCreateDocumento } from '../../hooks/useDocumentosLegais';
import { useVeiculos } from '../../hooks/useVeiculos'; 
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// Schema do Formulário
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

    // [NOVO] Extrai lista única de tipos de veículos da sua frota atual
    // Isso garante que apareça "POLIGUINDASTE", "VACUO", "MUNCK" etc.
    const tiposDisponiveis = useMemo(() => {
        if (!veiculos) return [];
        const tipos = veiculos
            .map(v => v.tipoVeiculo)
            .filter((t): t is string => !!t); // Remove nulos
        return Array.from(new Set(tipos)).sort(); // Remove duplicatas e ordena
    }, [veiculos]);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DocFormValues>({
        resolver: zodResolver(docSchema),
        defaultValues: { categoria: '' }
    });

    // Monitores para UX
    const veiculoIdSelecionado = watch('veiculoId');
    const categoriaSelecionada = watch('categoria');

    const handleUploadAndSubmit = async (data: DocFormValues) => {
        if (!file) {
            toast.error("Por favor, selecione um arquivo PDF ou Imagem.");
            return;
        }

        try {
            setUploading(true);

            // 1. Upload para o Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `documentos-legais/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('comprovantes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Obter URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('comprovantes')
                .getPublicUrl(filePath);

            // 3. Salvar no Banco
            criarDocumento({
                titulo: data.titulo,
                descricao: data.descricao,
                categoria: data.categoria, // Backend converte para uppercase (AST)
                arquivoUrl: publicUrl,
                tipoVeiculo: data.tipoVeiculo || undefined,
                veiculoId: data.veiculoId || undefined, 
                dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
            }, {
                onSuccess: () => {
                    onSuccess();
                }
            });

        } catch (error) {
            console.error(error);
            toast.error("Erro ao fazer upload do arquivo.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleUploadAndSubmit)} className="space-y-4">

            {/* Upload de Arquivo */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                    type="file"
                    id="doc-upload"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-sm font-medium text-gray-700">
                        {file ? file.name : "Clique para selecionar o arquivo (PDF ou Imagem)"}
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Título</label>
                    <Input {...register('titulo')} error={errors.titulo?.message} placeholder="Ex: AST 001 - Operação Padrão" />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Categoria</label>
                    <select
                        {...register('categoria')}
                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                    >
                        <option value="">Selecione...</option>

                        {/* [NOVO] Opção AST */}
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
                    {errors.categoria && <p className="text-xs text-red-500 mt-1 ml-1">{errors.categoria.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Validade (Opcional)</label>
                    <Input type="date" {...register('dataValidade')} />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo Veículo (Opcional)</label>
                    <select
                        {...register('tipoVeiculo')}
                        disabled={!!veiculoIdSelecionado}
                        // UX: Destaca o campo se for AST para incentivar o preenchimento
                        className={`w-full h-11 px-3 bg-white border rounded-lg text-sm focus:border-primary outline-none disabled:bg-gray-100 disabled:text-gray-400 ${categoriaSelecionada === 'AST' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}
                    >
                        <option value="">Aplicar a Todos</option>
                        
                        {/* [NOVO] Gera opções baseadas na sua frota real */}
                        {tiposDisponiveis.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}

                        {/* Fallback caso não tenha veículos cadastrados ainda */}
                        {!tiposDisponiveis.length && (
                            <>
                                <option value="CAMINHAO">Caminhões</option>
                                <option value="CARRO">Carros Leves</option>
                            </>
                        )}
                    </select>
                    
                    {categoriaSelecionada === 'AST' && (
                        <p className="text-[10px] text-yellow-600 mt-1 font-bold">
                            * Selecione o tipo para restringir a AST (ex: só Vácuo).
                        </p>
                    )}
                    {categoriaSelecionada !== 'AST' && (
                        <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para documentos globais.</p>
                    )}
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Placa Específica (Opcional)</label>
                    <select
                        {...register('veiculoId')}
                        onChange={(e) => {
                            setValue('veiculoId', e.target.value);
                            if (e.target.value) setValue('tipoVeiculo', '');
                        }}
                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                    >
                        <option value="">Nenhuma</option>
                        {veiculos?.map(v => (
                            <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição</label>
                <textarea
                    {...register('descricao')}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none resize-none h-24"
                    placeholder="Detalhes adicionais..."
                />
            </div>

            <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={uploading || isPending}
                    className="flex-[2]"
                >
                    {uploading ? 'Enviando...' : 'Salvar Documento'}
                </Button>
            </div>
        </form>
    );
}