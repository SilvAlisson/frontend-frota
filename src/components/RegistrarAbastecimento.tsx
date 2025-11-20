import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto'; 
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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

export function RegistrarAbastecimento({ 
  token, 
  usuarios, 
  veiculos, 
  produtos, 
  fornecedores 
}: RegistrarAbastecimentoProps) {

  // Estados
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null); 

  // Helpers de Lista
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!veiculoId || !operadorId || !fornecedorId || !kmOdometro || !dataHora || !placaCartaoUsado ||
        itens.some(item => !item.produtoId || !item.quantidade || !item.valorPorUnidade)) {
      setError('Preencha todos os campos obrigatórios e os itens.');
      setLoading(false);
      return;
    }

    if (placaCartaoUsado.length !== 4) {
        setError('O campo "Últimos 4 Dígitos do Cartão" deve conter exatamente 4 dígitos.');
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
        operadorId,
        fornecedorId,
        kmOdometro: parseFloat(kmOdometro),
        dataHora: new Date(dataHora).toISOString(),
        placaCartaoUsado: DOMPurify.sanitize(placaCartaoUsado),
        justificativa: DOMPurify.sanitize(justificativa) || null,
        itens: itensFormatados 
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
    setSuccess('Abastecimento registrado com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);
    setVeiculoId('');
    setOperadorId('');
    setFornecedorId('');
    setKmOdometro('');
    setPlacaCartaoUsado('');
    setJustificativa('');
    setItens([{ produtoId: '', quantidade: '', valorPorUnidade: '' }]); 
  };

  return (
    <> 
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
             </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">Novo Abastecimento</h4>
          <p className="text-sm text-text-secondary mt-1">Lançamento de combustível e Arla 32</p>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Veículo</label>
            <div className="relative">
                <select className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Operador</label>
            <div className="relative">
                <select className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none" value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
                <option value="">Selecione...</option>
                {usuarios.filter(u => u.role === 'OPERADOR').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Posto (Fornecedor)</label>
            <div className="relative">
                <select className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <Input label="KM Odómetro" type="number" value={kmOdometro} onChange={(e) => setKmOdometro(e.target.value)} />
          <Input label="Data e Hora" type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          <Input label="Últimos 4 Dígitos (Cartão)" type="number" value={placaCartaoUsado} onChange={(e) => setPlacaCartaoUsado(e.target.value)} maxLength={4} placeholder="Ex: 1234" />
        </div>

        {/* Lista Dinâmica de Itens */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
          <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">Itens Abastecidos</h4>
          
          <div className="space-y-3">
            {itens.map((item, index) => {
              const valorTotalItem = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valorPorUnidade) || 0);

              return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  {/* Produto */}
                  <div className="sm:col-span-4">
                     <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Produto</label>
                     <div className="relative">
                        <select 
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-input focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                            value={item.produtoId} 
                            onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                        >
                          <option value="">Item...</option>
                          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                     </div>
                  </div>
                  {/* Litros */}
                  <div className="sm:col-span-3">
                     <Input type="number" placeholder="Qtd/Litros" className="!py-2 text-right text-sm" value={item.quantidade} onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)} />
                  </div>
                  {/* Valor */}
                  <div className="sm:col-span-3">
                     <Input type="number" step="0.01" placeholder="R$ Unit." className="!py-2 text-right text-sm" value={item.valorPorUnidade} onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)} />
                  </div>
                  {/* Botão Remover + Total Visual */}
                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                     <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 sm:hidden">Total: </span>
                        <span className="text-sm font-bold text-gray-700 mr-2 block sm:inline">
                            {valorTotalItem > 0 ? `R$${valorTotalItem.toFixed(2)}` : 'R$0,00'}
                        </span>
                     </div>
                     {itens.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-1" title="Remover Item">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4">
             <Button type="button" variant="secondary" onClick={handleAddItem} className="text-xs">+ Adicionar Item</Button>
          </div>
        </div>
        
        <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Justificativas (Opcional)</label>
            <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary focus:border-transparent h-20 resize-none"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Houve troca de cartão? Ocorreu algum problema?"
            ></textarea>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-error px-4 py-3 rounded text-sm text-center">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-success px-4 py-3 rounded text-sm text-center">{success}</div>}
        
        <Button type="submit" disabled={loading} isLoading={loading} className="w-full py-3">
          {loading ? 'Validando...' : 'Registrar Abastecimento'}
        </Button>
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Foto da Nota Fiscal"
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