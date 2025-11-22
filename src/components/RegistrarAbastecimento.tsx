import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
// Importar as novas funções utilitárias
import { parseDecimal, formatKmVisual } from '../utils';

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
const inputStyle = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";
const labelStyle = "block mb-1.5 text-sm font-medium text-text-secondary";

export function RegistrarAbastecimento({
  token,
  usuarios,
  veiculos,
  produtos,
  fornecedores
}: RegistrarAbastecimentoProps) {

  // Estados dos campos
  const [veiculoId, setVeiculoId] = useState('');
  const [operadorId, setOperadorId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [kmOdometro, setKmOdometro] = useState('');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));
  const [placaCartaoUsado, setPlacaCartaoUsado] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [itens, setItens] = useState<ItemAbastecimento[]>([
    { produtoId: '', quantidade: '', valorPorUnidade: '' }
  ]);

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  // --- Handler específico para formatar o KM visualmente ---
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmOdometro(formatKmVisual(e.target.value));
  };

  // Funções de manipulação de itens
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

  // Lógica de envio (handleSubmit)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validação
    if (!veiculoId || !operadorId || !fornecedorId || !kmOdometro || !dataHora || !placaCartaoUsado ||
      itens.some(item => !item.produtoId || !item.quantidade || !item.valorPorUnidade)) {
      setError('Preencha todos os campos obrigatórios, incluindo os detalhes de cada item e os últimos 4 dígitos do cartão.');
      setLoading(false);
      return;
    }

    // Validação de 4 dígitos
    if (placaCartaoUsado.length !== 4) {
      setError('O campo "Últimos 4 Dígitos do Cartão" deve conter exatamente 4 dígitos.');
      setLoading(false);
      return;
    }

    try {
      // Formata os dados
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        valorPorUnidade: parseFloat(item.valorPorUnidade)
      }));

      const dadosCompletosDoFormulario = {
        veiculoId,
        operadorId,
        fornecedorId,
        // Converter o KM formatado (string "50.420") para número (50420)
        kmOdometro: parseDecimal(kmOdometro),
        dataHora: new Date(dataHora).toISOString(),
        placaCartaoUsado: DOMPurify.sanitize(placaCartaoUsado),
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

  // Callback de sucesso do modal
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
    setJustificativa('');
    setItens([{ produtoId: '', quantidade: '', valorPorUnidade: '' }]);
  };


  // --- JSX ---
  return (
    <>
      <form
        className="bg-transparent space-y-6"
        onSubmit={handleSubmit}
      >
        {/* CABEÇALHO COM ÍCONE */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">
            Novo Abastecimento
          </h4>
          <p className="text-sm text-text-secondary mt-1">
            Lançamento de combustível e Arla 32.
          </p>
        </div>

        {/* --- Campos Principais (Grid Tailwind) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Veículo (Placa)</label>
            <div className="relative">
              <select className={inputStyle} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div>
            <label className={labelStyle}>Operador</label>
            <div className="relative">
              <select className={inputStyle} value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
                <option value="">Selecione...</option>
                {usuarios.filter(u => u.role === 'OPERADOR').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div>
            <label className={labelStyle}>Fornecedor (Posto)</label>
            <div className="relative">
              <select className={inputStyle} value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* CAMPO KM ATUALIZADO */}
          <div>
            <label className={labelStyle}>KM Odômetro</label>
            <Input
              type="text" // Alterado para text para permitir pontuação
              inputMode="numeric"
              placeholder="Ex: 50.420"
              value={kmOdometro}
              onChange={handleKmChange} // Novo handler
            />
          </div>

          <div>
            <label className={labelStyle}>Data e Hora</label>
            <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </div>

          <div>
            <label className={labelStyle}>Últimos 4 Dígitos do Cartão</label>
            <Input
              type="number"
              value={placaCartaoUsado}
              onChange={(e) => setPlacaCartaoUsado(e.target.value)}
              placeholder="Ex: 1234"
              maxLength={4}
            />
          </div>
        </div>

        {/* --- Lista Dinâmica de Itens --- */}
        <div className="bg-gray-50 p-4 rounded-card border border-gray-200 mt-6">
          <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">
            Itens Abastecidos
          </h4>

          <div className="space-y-3">
            {itens.map((item, index) => {
              const quantidade = parseFloat(item.quantidade);
              const valorPorUnidade = parseFloat(item.valorPorUnidade);
              const valorTotalItem = (quantidade > 0 && valorPorUnidade > 0) ? (quantidade * valorPorUnidade) : 0;

              return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded-md shadow-sm border border-gray-100">

                  {/* Col 1: Produto (5 cols) */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Produto</label>
                    <div className="relative">
                      <select
                        className={inputStyle + " py-2 text-sm"}
                        value={item.produtoId}
                        onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                      >
                        <option value="">Produto...</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Litros (2 cols) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Litros</label>
                    <Input
                      type="number"
                      placeholder="Qtd"
                      className="!py-2 text-right text-sm"
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                    />
                  </div>

                  {/* Col 3: Valor/Litro (2 cols) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Valor Un.</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$"
                      className="!py-2 text-right text-sm"
                      value={item.valorPorUnidade}
                      onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)}
                    />
                  </div>

                  {/* Col 4: Total e Remover (3 cols) */}
                  <div className="sm:col-span-3 flex items-center justify-end gap-2">
                    <div className="text-right bg-gray-50 px-3 py-2 rounded border border-gray-200 w-full">
                      <span className="text-xs text-gray-500 sm:hidden mr-2">Total:</span>
                      <span className="text-sm font-bold text-gray-700">
                        {valorTotalItem > 0 ? `R$ ${valorTotalItem.toFixed(2)}` : 'R$ 0,00'}
                      </span>
                    </div>

                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-600 p-2 transition-colors"
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
              + Adicionar Item
            </Button>
          </div>
        </div>

        {/* --- Bloco de Justificativa --- */}
        <div className="pt-4">
          <label className={labelStyle}>Justificativas</label>
          <textarea
            className={inputStyle + " h-24 resize-none"}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Justificar se houve uso de cartão de outro veículo ou outra ocorrência (opcional)"
          ></textarea>
        </div>

        {/* Mensagens e Botão de Envio */}
        {error && <p className="text-center text-error bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
        {success && <p className="text-center text-success bg-green-50 p-3 rounded-md border border-green-200">{success}</p>}

        <div className="pt-4">
          <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
            {loading ? 'Validando...' : 'Registrar Abastecimento'}
          </Button>
        </div>
      </form>

      {/* Renderização do Modal */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Envie a foto da nota fiscal"

          dadosJornada={formDataParaModal}
          apiEndpoint="/abastecimento"
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