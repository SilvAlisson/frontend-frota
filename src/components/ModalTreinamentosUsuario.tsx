import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { TreinamentoRealizado, User } from '../types';

interface ModalProps {
  usuario: User;
  onClose: () => void;
}

// SCHEMA V4
const treinamentoSchema = z.object({
  nome: z.string({ error: "Nome obrigatório" }).min(2, { error: "Nome curto" }),
  dataRealizacao: z.string({ error: "Data obrigatória" }).min(1, { error: "Data obrigatória" }),
  dataVencimento: z.string().optional().or(z.literal('')),
  descricao: z.string().optional(),
  comprovanteUrl: z.string().optional().or(z.literal('')),
});

type TreinamentoForm = z.infer<typeof treinamentoSchema>;

export function ModalTreinamentosUsuario({ usuario, onClose }: ModalProps) {
  const [treinamentos, setTreinamentos] = useState<TreinamentoRealizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TreinamentoForm>({
    resolver: zodResolver(treinamentoSchema), // ✅ REMOVIDO 'as any'
    defaultValues: {
      nome: '',
      dataRealizacao: new Date().toISOString().split('T')[0],
      dataVencimento: '',
      descricao: '',
      comprovanteUrl: ''
    }
  });

  // ... (Resto do código de fetch, delete e importação permanece inalterado) ...
  // Apenas garantindo que não mexemos na lógica de negócios complexa, apenas na tipagem do form

  const fetchTreinamentos = async () => {
    setLoading(true);
    try {
      const response = await api.get<TreinamentoRealizado[]>(`/treinamentos/user/${usuario.id}`);
      setTreinamentos(response.data);
    } catch (err) {
      console.error("Erro ao buscar treinamentos:", err);
      alert("Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreinamentos();
  }, [usuario.id]);

  const onSubmit = async (data: TreinamentoForm) => {
    try {
      await api.post('/treinamentos', {
        userId: usuario.id,
        nome: data.nome,
        dataRealizacao: new Date(data.dataRealizacao).toISOString(),
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento).toISOString() : null,
        descricao: data.descricao || null,
        comprovanteUrl: data.comprovanteUrl || null
      });
      reset();
      fetchTreinamentos();
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar treinamento.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este registro de treinamento?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/treinamentos/${id}`);
      setTreinamentos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Erro ao remover.");
    } finally {
      setDeletingId(null);
    }
  };

  // ... (Lógica de Importação Excel mantida igual) ...
  const handleClickImportar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportando(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);
              if (data.length === 0) { alert("A planilha parece estar vazia."); setImportando(false); return; }
              const treinamentosFormatados = data.map((row: any) => {
                  const nome = row['Nome'] || row['Curso'] || row['Treinamento'] || row['nome'];
                  const dataRealizacaoRaw = row['Data'] || row['Realizacao'] || row['Data Realizacao'] || row['data'];
                  const dataVencimentoRaw = row['Vencimento'] || row['Validade'] || row['Data Vencimento'];
                  const descricao = row['Descricao'] || row['Obs'] || row['Observacoes'];
                  if (!nome || !dataRealizacaoRaw) return null;
                  const parseExcelDate = (val: any) => {
                      if (!val) return null;
                      if (typeof val === 'number') { return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString(); }
                      if (typeof val === 'string' && val.includes('/')) { const [d, m, y] = val.split('/'); return new Date(`${y}-${m}-${d}`).toISOString(); }
                      return new Date(val).toISOString();
                  };
                  return { nome: String(nome), descricao: descricao ? String(descricao) : null, dataRealizacao: parseExcelDate(dataRealizacaoRaw), dataVencimento: parseExcelDate(dataVencimentoRaw), };
              }).filter(t => t !== null);
              if (treinamentosFormatados.length === 0) { alert("Nenhum dado válido encontrado."); setImportando(false); return; }
              await api.post('/treinamentos/importar', { userId: usuario.id, treinamentos: treinamentosFormatados });
              alert(`${treinamentosFormatados.length} treinamentos importados com sucesso!`);
              fetchTreinamentos();
          } catch (error) { console.error("Erro na importação:", error); alert("Erro ao processar o arquivo Excel."); } finally { setImportando(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
      };
      reader.readAsBinaryString(file);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white rounded-card shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            {/* Lado Esquerdo: Formulário + Importação */}
            <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-100 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-primary">Novo Registro</h3>
                    <p className="text-xs text-text-secondary">Lançar curso para <span className="font-bold">{usuario.nome}</span></p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Nome do Curso" placeholder="Ex: Direção Defensiva" {...register('nome')} error={errors.nome?.message} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Realização" type="date" {...register('dataRealizacao')} error={errors.dataRealizacao?.message} />
                        <Input label="Vencimento" type="date" {...register('dataVencimento')} />
                    </div>
                    <Input label="Link Certificado" placeholder="https://..." {...register('comprovanteUrl')} error={errors.comprovanteUrl?.message} />
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Observações</label>
                        <textarea {...register('descricao')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none" placeholder="Detalhes adicionais..." />
                    </div>
                    <Button type="submit" className="w-full" isLoading={isSubmitting}>Adicionar Manual</Button>
                </form>

                {/* --- ÁREA DE IMPORTAÇÃO --- */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 px-2 text-gray-500 font-bold">ou importar</span></div>
                </div>

                <div>
                    <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button type="button" variant="success" className="w-full" onClick={handleClickImportar} isLoading={importando} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}>Subir Planilha Excel</Button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center leading-tight">Colunas necessárias: <strong>Nome</strong>, <strong>Data</strong>. <br />Opcionais: Vencimento, Obs.</p>
                </div>
            </div>

            {/* Lado Direito: Lista */}
            <div className="flex-1 p-6 flex flex-col h-full bg-white overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-text">Histórico de Capacitação</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {loading && <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>}
                    {!loading && treinamentos.length === 0 && <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg"><p className="text-gray-400">Nenhum treinamento registrado.</p></div>}
                    {treinamentos.map(treino => {
                        const isVencido = treino.dataVencimento && new Date(treino.dataVencimento) < new Date();
                        return (
                            <div key={treino.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow flex justify-between items-start bg-gray-50/50">
                                <div>
                                    <h4 className="font-bold text-primary">{treino.nome}</h4>
                                    <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                        <span>Realizado: <strong>{formatDate(treino.dataRealizacao)}</strong></span>
                                        {treino.dataVencimento && <span className={isVencido ? "text-red-600 font-bold" : "text-green-600"}>Vence: {formatDate(treino.dataVencimento)}</span>}
                                    </div>
                                    {treino.descricao && <p className="text-xs text-gray-500 mt-1">{treino.descricao}</p>}
                                    {treino.comprovanteUrl && <a href={treino.comprovanteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">Ver Certificado ↗</a>}
                                </div>
                                <button onClick={() => handleDelete(treino.id)} disabled={deletingId === treino.id} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors" title="Remover">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
}