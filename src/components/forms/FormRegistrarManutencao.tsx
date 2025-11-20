import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto'; 
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Estilos reutilizáveis para elementos nativos (Select, Textarea)
// para manter consistência com o componente UI Input
const labelStyle = "block mb-1.5 text-sm font-medium text-text-secondary";
const inputStyle = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";

// Tipos (baseados no schema.prisma)
interface FormRegistrarManutencaoProps {
  token: string;
  veiculos: any[];
  produtos: any[];    // Vamos reutilizar os produtos (ex: "Troca de Óleo", "Lavagem")
  fornecedores: any[]; // Vamos reutilizar os fornecedores (ex: "Oficina X", "Lava-Rápido Y")
}
interface ItemManutencao {
  produtoId: string;
  quantidade: string;
  valorPorUnidade: string;
}
// Pegamos os tipos de manutenção do enum do Prisma
const tiposDeManutencao = ["PREVENTIVA", "CORRETIVA", "LAVAGEM"];

// Adicionar a função parseDecimal
/**
 * Converte uma string de moeda ou decimal (ex: "5,99") para um número (ex: 5.99)
 */
const parseDecimal = (value: string): number => {
  if (!value) return 0;
  // Substitui vírgula por ponto para o parseFloat
  const parsableValue = value.replace(",", ".");
  const parsed = parseFloat(parsableValue);
  return isNaN(parsed) ? 0 : parsed;
};

export function FormRegistrarManutencao({ 
  token, 
  veiculos, 
  produtos, 
  fornecedores 
}: FormRegistrarManutencaoProps) {

  // Estados dos campos
  const [veiculoId, setVeiculoId] = useState('');
  const [fornecedorId, setFornecedorId] = useState(''); // Oficina/Lava-Rápido
  const [kmAtual, setKmAtual] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10)); // Padrão 'date'
  const [tipo, setTipo] = useState('CORRETIVA'); // Padrão
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemManutencao[]>([
    { produtoId: '', quantidade: '1', valorPorUnidade: '' } // Padrão 1 unidade
  ]);
  
  // Estados de controlo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  // Funções de manipulação de itens
  const handleItemChange = (index: number, field: keyof ItemManutencao, value: string) => {
    const novosItens = [...itens];
    novosItens[index][field] = value;
    setItens(novosItens);
  };
  const handleAddItem = () => {
    setItens([...itens, { produtoId: '', quantidade: '1', valorPorUnidade: '' }]);
  };
  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      const novosItens = itens.filter((_, i) => i !== index);
      setItens(novosItens);
    }
  };

  // Lógica de envio
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!veiculoId || !fornecedorId || !kmAtual || !data || !tipo ||
        itens.some(item => !item.produtoId || !item.quantidade || !item.valorPorUnidade)) {
      setError('Preencha todos os campos obrigatórios (Veículo, Oficina, KM, Data, Tipo e Itens).');
      setLoading(false);
      return;
    }

    try {
      // Usar parseDecimal na conversão
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseDecimal(item.quantidade),
        valorPorUnidade: parseDecimal(item.valorPorUnidade)
      }));

      const dadosCompletosDoFormulario = {
        veiculoId,
        fornecedorId,
        kmAtual: parseDecimal(kmAtual), // Usar parseDecimal
        data: new Date(data).toISOString(),
        tipo,
        observacoes: DOMPurify.sanitize(observacoes) || null,
        itens: itensFormatados
        // fotoComprovanteUrl será adicionada pelo modal
      };

      setFormDataParaModal(dadosCompletosDoFormulario);
      setModalAberto(true);

    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      setError('Falha ao preparar dados para envio.');
    } finally {
      setLoading(false);
    }
  };

  // Limpar todos os campos do formulário
  const handleModalSuccess = () => {
    setSuccess('Manutenção/Lavagem registada com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);
    
    // Limpa o formulário
    setVeiculoId('');
    setFornecedorId('');
    setKmAtual('');
    setData(new Date().toISOString().slice(0, 10)); // Resetar data
    setTipo('CORRETIVA');
    setObservacoes('');
    setItens([{ produtoId: '', quantidade: '1', valorPorUnidade: '' }]); 
  };
  
  // Filtra produtos (só podemos usar SERVICO ou OUTRO numa OS)
  const produtosFiltrados = produtos.filter(
    p => p.tipo === 'SERVICO' || p.tipo === 'OUTRO'
  );

  return (
    <> 
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* CABEÇALHO COM ÍCONE */}
        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
                {/* Ícone de Ferramentas/Manutenção */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" />
                </svg>
            </div>
            <h4 className="text-xl font-bold text-primary">
              Registar Manutenção
            </h4>
            <p className="text-sm text-text-secondary mt-1">
              Lançamento de serviços, peças ou lavagens.
            </p>
        </div>

        {/* --- Campos Principais (Grid Tailwind) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Veículo</label>
            <div className="relative">
                <select 
                    className={inputStyle}
                    value={veiculoId} 
                    onChange={(e) => setVeiculoId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
                </select>
                {/* Seta customizada para o select */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Oficina / Lava-Rápido</label>
             <div className="relative">
                <select 
                    className={inputStyle}
                    value={fornecedorId} 
                    onChange={(e) => setFornecedorId(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
          </div>

           <Input 
             label="KM Atual" 
             type="text" 
             inputMode="decimal"
             value={kmAtual} 
             onChange={(e) => setKmAtual(e.target.value)} 
             placeholder="Ex: 50420"
           />

           <Input 
             label="Data do Serviço" 
             type="date" 
             value={data} 
             onChange={(e) => setData(e.target.value)} 
           />

          <div>
            <label className={labelStyle}>Tipo de Serviço</label>
             <div className="relative">
                <select 
                    className={inputStyle}
                    value={tipo} 
                    onChange={(e) => setTipo(e.target.value)}
                >
                    {tiposDeManutencao.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
          </div>
        </div>

        {/* --- Lista Dinâmica de Itens --- */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                Itens Realizados
            </h4>
            
            <div className="space-y-3">
              {itens.map((item, index) => {
                // Usar parseDecimal para calcular o total visual
                const quantidade = parseDecimal(item.quantidade);
                const valorPorUnidade = parseDecimal(item.valorPorUnidade);
                const valorTotalItem = (quantidade > 0 && valorPorUnidade > 0) ? (quantidade * valorPorUnidade) : 0;

                return (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded-md shadow-sm border border-gray-100">
                    
                    {/* Col 1: Produto (6 cols) */}
                    <div className="sm:col-span-5">
                        <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Item</label>
                        <div className="relative">
                             <select 
                              className={inputStyle + " py-2 text-sm"} // Ajuste de altura
                              value={item.produtoId} 
                              onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                            >
                              <option value="">Selecione o Item...</option>
                              {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Qtd (2 cols) */}
                    <div className="sm:col-span-2">
                         <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Qtd</label>
                         <Input 
                          type="text" 
                          inputMode="decimal"
                          placeholder="Qtd"
                          className="!py-2 text-right text-sm"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        />
                    </div>

                    {/* Col 3: Valor Unitário (2 cols) */}
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Valor Un.</label>
                        <Input 
                          type="text" 
                          inputMode="decimal"
                          placeholder="R$"
                          className="!py-2 text-right text-sm"
                          value={item.valorPorUnidade}
                          onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)}
                        />
                    </div>

                    {/* Col 4: Total (2 cols) - Visual apenas */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <div className="text-right bg-gray-50 px-3 py-2 rounded border border-gray-200 w-full">
                             <span className="text-xs text-gray-500 sm:hidden mr-2">Total:</span>
                             <span className="text-sm font-bold text-gray-700">
                                {valorTotalItem > 0 ? `R$ ${valorTotalItem.toFixed(2)}` : 'R$ 0,00'}
                             </span>
                        </div>
                         {/* Botão Remover */}
                        {itens.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(index)} 
                            className="text-red-400 hover:text-red-600 p-2 transition-colors"
                            title="Remover item"
                          > 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleAddItem} 
                  className="text-xs"
                >
                  + Adicionar Outro Item
                </Button>
            </div>
        </div>

        {/* --- Observações --- */}
        <div className="pt-4">
             <label className={labelStyle}>Observações / Detalhes</label>
             <textarea
                 className={inputStyle + " h-24 resize-none"}
                 value={observacoes}
                 onChange={(e) => setObservacoes(e.target.value)}
                 placeholder="Descreva peças trocadas, garantia ou observações importantes..."
             ></textarea>
        </div>

        {error && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                 <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
               </svg>
               <span>{error}</span>
            </div>
        )}

        {success && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
               <span>{success}</span>
            </div>
        )}
        
        <div className="pt-4">
            <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
               {loading ? 'A Validar...' : 'Registar Serviço'}
            </Button>
        </div>
      </form>

      {/* Renderização do Modal */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Envie a foto do Comprovativo / Nota Fiscal"
          
          dadosJornada={formDataParaModal} 
          apiEndpoint="/ordem-servico" 
          apiMethod="POST"
          
          kmParaConfirmar={null}
          jornadaId={null}

          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}