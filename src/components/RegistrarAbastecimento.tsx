import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto'; 

// Tipos
interface RegistrarAbastecimentoProps {
  token: string;
  usuarios: any[]; 
  veiculos: any[];
  produtos: any[];
  fornecedores: any[];
}
interface ItemAbastecimento {
  produtoId: string;
  quantidade: string;
  valorPorUnidade: string;
}

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

export function RegistrarAbastecimento({ 
  token, 
  usuarios, 
  veiculos, 
  produtos, 
  fornecedores 
}: RegistrarAbastecimentoProps) {

  // Estados dos campos (sem alteração)
  const [veiculoId, setVeiculoId] = useState('');
  const [operadorId, setOperadorId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [kmOdometro, setKmOdometro] = useState('');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));
  const [placaCartaoUsado, setPlacaCartaoUsado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [itens, setItens] = useState<ItemAbastecimento[]>([
    { produtoId: '', quantidade: '', valorPorUnidade: '' } 
  ]);
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // <-- MUDANÇA: Novos estados para controlar o fluxo do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null); // Guarda os dados para o modal

  // Funções de manipulação de itens (sem alteração)
  const handleItemChange = (index: number, field: keyof ItemAbastecimento, value: string) => {
    const novosItens = [...itens];
    novosItens[index][field] = value;
    setItens(novosItens);
  };
  const handleAddItem = () => {
    setItens([...itens, { produtoId: '', quantidade: '', valorPorUnidade: '' }]);
  };
  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      const novosItens = itens.filter((_, i) => i !== index);
      setItens(novosItens);
    }
  };

  // <-- MUDANÇA: Lógica de envio (handleSubmit) foi alterada
  // Agora ela apenas VALIDA e ABRE O MODAL
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validação ATUALIZADA (placaCartaoUsado agora é obrigatório)
    if (!veiculoId || !operadorId || !fornecedorId || !kmOdometro || !dataHora || !placaCartaoUsado ||
        itens.some(item => !item.produtoId || !item.quantidade || !item.valorPorUnidade)) {
      setError('Preencha todos os campos obrigatórios, incluindo os detalhes de cada item e os 6 dígitos do cartão.');
      setLoading(false);
      return;
    }

    // Validação de 6 dígitos
    if (placaCartaoUsado.length !== 6) {
        setError('O campo "Últimos 6 Dígitos do Cartão" deve conter exatamente 6 dígitos.');
        setLoading(false);
        return;
    }

    try {
      // Formata os dados que serão enviados ao modal (e depois à API)
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        valorPorUnidade: parseFloat(item.valorPorUnidade)
      }));

      const dadosCompletosDoFormulario = {
        veiculoId,
        operadorId,
        fornecedorId,
        kmOdometro: parseFloat(kmOdometro),
        dataHora: new Date(dataHora).toISOString(),
        placaCartaoUsado: DOMPurify.sanitize(placaCartaoUsado),
        observacoes: DOMPurify.sanitize(observacoes) || null,
        justificativa: DOMPurify.sanitize(justificativa) || null,
        itens: itensFormatados 
      };

      // Guarda os dados no estado e abre o modal
      setFormDataParaModal(dadosCompletosDoFormulario);
      setModalAberto(true);

    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      setError('Falha ao preparar dados para envio.');
    } finally {
      setLoading(false);
    }
  };

  // <-- MUDANÇA: Nova função de callback para o modal
  // Isso limpa o formulário APÓS o modal confirmar o envio
  const handleModalSuccess = () => {
    setSuccess('Abastecimento registrado com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);
    
    // Limpa o formulário
    setVeiculoId('');
    setOperadorId('');
    setFornecedorId('');
    setKmOdometro('');
    setPlacaCartaoUsado('');
    setObservacoes('');
    setJustificativa('');
    setItens([{ produtoId: '', quantidade: '', valorPorUnidade: '' }]); 
  };


  // --- JSX Refatorado para Tailwind ---
  return (
    // O <form> agora engloba o modal
    <> 
      <form 
        className="bg-transparent space-y-4"
        onSubmit={handleSubmit}
      >
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
            <label className={labelStyle}>Operador</label>
            <select className={inputStyle} value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
              <option value="">Selecione...</option>
              {usuarios.filter(u => u.role === 'OPERADOR').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelStyle}>Fornecedor (Posto)</label>
            <select className={inputStyle} value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
              <option value="">Selecione...</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelStyle}>KM Odômetro</label>
            <input className={inputStyle} type="number" value={kmOdometro} onChange={(e) => setKmOdometro(e.target.value)} />
          </div>
          <div>
            <label className={labelStyle}>Data e Hora</label>
            <input className={inputStyle} type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </div>
          <div>
            {/* <-- MUDANÇA: Label e placeholder atualizados */}
            <label className={labelStyle}>Últimos 6 Dígitos do Cartão</label>
            <input 
              className={inputStyle} 
              type="number" // Mudei para 'number' para facilitar
              value={placaCartaoUsado} 
              onChange={(e) => setPlacaCartaoUsado(e.target.value)} 
              placeholder="Ex: 123456"
              maxLength={6} // Embora number não use maxLength, é uma boa prática
            />
          </div>
        </div>

        {/* --- Lista Dinâmica de Itens --- */}
        <h4 className="text-lg font-semibold text-klin-azul text-center border-t pt-4 mt-4">Itens Abastecidos (Diesel, ARLA, etc.)</h4>
        
        <div className="space-y-3">
          {itens.map((item, index) => {
            // <-- MUDANÇA: Cálculo de total do item
            const quantidade = parseFloat(item.quantidade);
            const valorPorUnidade = parseFloat(item.valorPorUnidade);
            const valorTotalItem = (quantidade > 0 && valorPorUnidade > 0) ? (quantidade * valorPorUnidade) : 0;

            return (
              // <-- MUDANÇA: Grid atualizado para incluir o Total (5 colunas)
              <div key={index} className="grid grid-cols-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
                {/* Col 1: Produto */}
                <select 
                  className={inputStyle + " py-2"}
                  value={item.produtoId} 
                  onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                >
                  <option value="">Produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {/* Col 2: Litros */}
                <input 
                  type="number" 
                  placeholder="Litros" // <-- MUDANÇA
                  className={inputStyle + " py-2 text-right"}
                  value={item.quantidade}
                  onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                />
                {/* Col 3: Valor/Litro (R$) */}
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Valor/Litro (R$)" // <-- MUDANÇA
                  className={inputStyle + " py-2 text-right"}
                  value={item.valorPorUnidade}
                  onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)}
                />

                {/* <-- MUDANÇA: Col 4: Total (R$) - Novo campo calculado --> */}
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
                  >
                    X
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Botão para adicionar mais itens */}
        <button 
          type="button" 
          onClick={handleAddItem} 
          className="bg-green-100 text-green-700 hover:bg-green-200 text-sm font-bold py-2 px-4 rounded self-start"
        >
          + Adicionar Item
        </button>

        {/* --- Bloco de Observação e Justificativa (Sem alteração) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
              <label className={labelStyle}>Observações</label>
              <textarea
                  className={inputStyle + " h-24"}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações gerais (opcional)"
              ></textarea>
          </div>
          <div>
              <label className={labelStyle}>Justificativa (Ocorrência)</label>
              <textarea
                  className={inputStyle + " h-24"}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Justificar se houve uso de cartão de outro veículo (opcional)"
              ></textarea>
          </div>
        </div>

        {/* Mensagens e Botão de Envio */}
        {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
        {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}
        
        <button type="submit" disabled={loading} className={buttonStyle + " mt-4"}>
          {loading ? 'Validando...' : 'Registrar Abastecimento'}
        </button>
      </form>

      {/* // <-- MUDANÇA: Renderização do Modal
        // Ele só aparece quando 'modalAberto' é true e os dados estão prontos.
      */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Envie a foto da nota fiscal"
          
          // Dados que o modal precisa para enviar o POST
          dadosJornada={formDataParaModal} 
          apiEndpoint="/abastecimento" // <-- MUDANÇA: API de destino
          apiMethod="POST" // <-- MUDANÇA: Método
          
          // Campos que não usamos aqui (passamos null)
          kmParaConfirmar={null} 
          jornadaId={null}

          // Callbacks
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess} // <-- MUDANÇA: Limpa o form no sucesso
        />
      )}
    </>
  );
}