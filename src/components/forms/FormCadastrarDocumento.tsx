import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../supabaseClient'; // Importe seu cliente Supabase
import { useCreateDocumento } from '../../hooks/useDocumentosLegais';
import { useVeiculos } from '../../hooks/useVeiculos'; // <--- Importando hook de veículos
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// Schema do Formulário
const docSchema = z.object({
    titulo: z.string().min(3, "Mínimo 3 caracteres"),
    descricao: z.string().optional(),
    categoria: z.string().min(1, "Selecione uma categoria"),
    dataValidade: z.string().optional(), // Input date vem como string
    tipoVeiculo: z.string().optional(),
    veiculoId: z.string().optional(), // <--- Novo campo para ID do veículo
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
    const { data: veiculos } = useVeiculos(); // <--- Buscando lista de veículos

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DocFormValues>({
        resolver: zodResolver(docSchema),
        defaultValues: { categoria: '' } // [CORREÇÃO] Inicia vazio para forçar escolha
    });

    // Monitora se o usuário selecionou uma placa específica
    const veiculoIdSelecionado = watch('veiculoId');

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
                .from('comprovantes') // Certifique-se que este bucket existe no Supabase
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Obter URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('comprovantes')
                .getPublicUrl(filePath);

            // 3. Salvar no Banco (Via Backend)
            criarDocumento({
                titulo: data.titulo,
                descricao: data.descricao,
                categoria: data.categoria,
                arquivoUrl: publicUrl,
                tipoVeiculo: data.tipoVeiculo || undefined,
                veiculoId: data.veiculoId || undefined, // <--- Enviando o ID do veículo
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
                    <Input {...register('titulo')} error={errors.titulo?.message} placeholder="Ex: Licença ANTT" />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Categoria</label>
                    <select
                        {...register('categoria')}
                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                    >
                        <option value="">Selecione...</option>

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
                        disabled={!!veiculoIdSelecionado} // Desabilita se selecionou placa específica
                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <option value="">Aplicar a Todos</option>
                        <option value="CAMINHAO">Caminhões</option>
                        <option value="CARRO">Carros Leves</option>
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para documentos globais da empresa.</p>
                </div>

                {/* Seleção de Veículo Específico */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Placa Específica (Opcional)</label>
                    <select
                        {...register('veiculoId')}
                        onChange={(e) => {
                            setValue('veiculoId', e.target.value);
                            // Se selecionar um veículo, limpa o "Tipo" pois a placa já define o contexto
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