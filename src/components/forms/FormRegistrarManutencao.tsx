import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto'; 

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

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

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
  
  // Estados de controlo (iguais ao Abastecimento)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  // Funções de manipulação de itens (iguais ao Abastecimento)
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

  // Lógica de envio (igual ao Abastecimento, mas para a nova rota)
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
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        valorPorUnidade: parseFloat(item.valorPorUnidade)
      }));

      const dadosCompletosDoFormulario = {
        veiculoId,
        fornecedorId,
        kmAtual: parseFloat(kmAtual),
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

  const handleModalSuccess = () => {
    setSuccess('Manutenção/Lavagem registada com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);
    
    // Limpa o formulário
    setVeiculoId('');
    setFornecedorId('');
    setKmAtual('');
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
      <form 
        className="bg-transparent space-y-4"
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl font-semibold text-klin-azul mb-3 text-center">Registar Manutenção ou Lavagem</h3>

        {/* --- Campos Principais (Grid Tailwind) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Veículo (Placa)</label>
            <select className={inputStyle} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
              <option value="">Selecione...</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
            </select>
          </div>
          <div>
            <label className={labelStyle}>Oficina / Lava-Rápido (Fornecedor)</label>
            <select className={inputStyle} value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
              <option value="">Selecione...</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
           <div>
            <label className={labelStyle}>KM Atual (Odômetro)</label>
            <input className={inputStyle} type="number" value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} />
          </div>
           <div>
            <label className={labelStyle}>Data do Serviço</label>
            <input className={inputStyle} type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className={labelStyle}>Tipo de Serviço</label>
            <select className={inputStyle} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tiposDeManutencao.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* --- Lista Dinâmica de Itens --- */}
        <h4 className="text-lg font-semibold text-klin-azul text-center border-t pt-4 mt-4">Itens / Serviços Realizados</h4>
        
        <div className="space-y-3">
          {itens.map((item, index) => {
            const quantidade = parseFloat(item.quantidade);
            const valorPorUnidade = parseFloat(item.valorPorUnidade);
            const valorTotalItem = (quantidade > 0 && valorPorUnidade > 0) ? (quantidade * valorPorUnidade) : 0;

            return (
              <div key={index} className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
                {/* Col 1: Produto (Filtrado) */}
                <select 
                  className={inputStyle + " py-2"}
                  value={item.produtoId} 
                  onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                >
                  <option value="">Selecione o Serviço/Produto...</option>
                  {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {/* Col 2: Qtd */}
                <input 
                  type="number" 
                  placeholder="Qtd"
                  className={inputStyle + " py-2 text-right"}
                  value={item.quantidade}
                  onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                />
                {/* Col 3: Valor Unitário (R$) */}
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Valor/Un (R$)"
                  className={inputStyle + " py-2 text-right"}
                  value={item.valorPorUnidade}
                  onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)}
                />
                {/* Col 4: Total (R$) */}
                <div className="text-center px-2 py-2 rounded bg-gray-100 border">
                  <span className="text-gray-800 font-semibold text-sm md:text-base">
                    {valorTotalItem > 0 ? `R$ ${valorTotalItem.toFixed(2)}` : 'R$ 0,00'}
                  </span>
                </div>
                {/* Col 5: Botão Remover */}
                {itens.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)} 
                    className="bg-red-100 text-red-700 hover:bg-red-200 text-sm font-bold py-2 px-3 rounded"
                  > X </button>
                )}
              </div>
            );
          })}
        </div>
        
        <button 
          type="button" 
          onClick={handleAddItem} 
          className="bg-green-100 text-green-700 hover:bg-green-200 text-sm font-bold py-2 px-4 rounded self-start"
        >
          + Adicionar Item/Serviço
        </button>

        {/* --- Observações --- */}
        <div className="pt-4 border-t">
          <div>
              <label className={labelStyle}>Observações</label>
              <textarea
                  className={inputStyle + " h-24"}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Detalhes do serviço, garantia, etc. (opcional)"
              ></textarea>
          </div>
        </div>

        {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
        {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}
        
        <button type="submit" disabled={loading} className={buttonStyle + " mt-4"}>
          {loading ? 'Validando...' : 'Registar Serviço'}
        </button>
      </form>

      {/* Renderização do Modal */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Envie a foto do Comprovativo / Nota Fiscal"
          
          dadosJornada={formDataParaModal} 
          apiEndpoint="/ordem-servico" // Rota de destino
          apiMethod="POST"
          
          kmParaConfirmar={null} // Não precisamos confirmar KM aqui
          jornadaId={null}

          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}