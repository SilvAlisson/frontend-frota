import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseDecimal, formatKmVisual } from '../utils';
import { toast } from 'sonner';
import type { User, Veiculo, Produto, Fornecedor } from '../types';

interface RegistrarAbastecimentoProps {
  usuarios: User[];
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
}

interface ItemAbastecimento {
  produtoId: string;
  quantidade: string;
  valorPorUnidade: string;
}

const selectStyle = "w-full px-4 py-2.5 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400";
const labelStyle = "block mb-1.5 text-sm font-bold text-text-secondary";

export function RegistrarAbastecimento({
  usuarios,
  veiculos,
  produtos,
  fornecedores
}: RegistrarAbastecimentoProps) {

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
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmOdometro(formatKmVisual(e.target.value));
  };

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

    // Validação Manual Rápida (Pode migrar para Zod se desejar padronizar 100%)
    if (!veiculoId || !operadorId || !fornecedorId || !kmOdometro || !dataHora || !placaCartaoUsado ||
      itens.some(item => !item.produtoId || !item.quantidade || !item.valorPorUnidade)) {
      toast.warning('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (placaCartaoUsado.length !== 4) {
      toast.error('Os últimos dígitos do cartão devem ter 4 números.');
      setLoading(false);
      return;
    }

    try {
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseFloat(item.quantidade),
        valorPorUnidade: parseFloat(item.valorPorUnidade)
      }));

      const dadosFormulario = {
        veiculoId,
        operadorId,
        fornecedorId,
        kmOdometro: parseDecimal(kmOdometro),
        dataHora: new Date(dataHora).toISOString(),
        placaCartaoUsado: DOMPurify.sanitize(placaCartaoUsado),
        justificativa: DOMPurify.sanitize(justificativa) || null,
        itens: itensFormatados
      };

      setFormDataParaModal(dadosFormulario);
      setModalAberto(true);

    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      toast.error('Falha ao preparar dados para envio.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    toast.success('Abastecimento registrado com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);

    // Reset Form
    setVeiculoId('');
    setOperadorId('');
    setFornecedorId('');
    setKmOdometro('');
    setPlacaCartaoUsado('');
    setJustificativa('');
    setItens([{ produtoId: '', quantidade: '', valorPorUnidade: '' }]);
  };

  // Cálculo do total geral em tempo real
  const totalGeral = itens.reduce((acc, item) => {
    const qtd = parseFloat(item.quantidade) || 0;
    const val = parseFloat(item.valorPorUnidade) || 0;
    return acc + (qtd * val);
  }, 0);

  return (
    <>
      <form className="space-y-8 bg-white p-6 rounded-card shadow-card border border-gray-100" onSubmit={handleSubmit}>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-3 ring-4 ring-green-50/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">
            Novo Abastecimento
          </h4>
          <p className="text-sm text-text-secondary mt-1">
            Registre os detalhes do abastecimento realizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Veículo</label>
            <div className="relative group">
              <select className={selectStyle} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} disabled={loading}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Motorista</label>
            <div className="relative group">
              <select className={selectStyle} value={operadorId} onChange={(e) => setOperadorId(e.target.value)} disabled={loading}>
                <option value="">Selecione...</option>
                {usuarios.filter(u => u.role === 'OPERADOR').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <div>
            <label className={labelStyle}>Posto / Fornecedor</label>
            <div className="relative group">
              <select className={selectStyle} value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} disabled={loading}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 group-hover:text-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>

          <div>
            <Input
              label="KM Odômetro"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 50.420"
              value={kmOdometro}
              onChange={handleKmChange}
              disabled={loading}
            />
          </div>

          <div>
            <label className={labelStyle}>Data e Hora</label>
            <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} disabled={loading} />
          </div>

          <div>
            <Input
              label="Final do Cartão (4 dígitos)"
              type="text"
              inputMode="numeric"
              value={placaCartaoUsado}
              onChange={(e) => setPlacaCartaoUsado(e.target.value)}
              placeholder="Ex: 1234"
              maxLength={4}
              disabled={loading}
            />
          </div>
        </div>

        {/* ITENS ABASTECIDOS */}
        <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide">Detalhes do Abastecimento</h4>
            <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
              {itens.length} item(ns)
            </span>
          </div>

          <div className="space-y-3">
            {itens.map((item, index) => {
              const quantidade = parseFloat(item.quantidade);
              const valorPorUnidade = parseFloat(item.valorPorUnidade);
              const valorTotalItem = (quantidade > 0 && valorPorUnidade > 0) ? (quantidade * valorPorUnidade) : 0;

              return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg shadow-sm border border-gray-200">

                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Produto</label>
                    <div className="relative">
                      <select
                        className={selectStyle + " py-2 text-sm"}
                        value={item.produtoId}
                        onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Selecione...</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Litros</label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="!py-2 text-right text-sm"
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Valor Un.</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      className="!py-2 text-right text-sm"
                      value={item.valorPorUnidade}
                      onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end justify-end gap-2 h-full pb-0.5">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Subtotal</p>
                      <p className="text-sm font-bold text-gray-700">{valorTotalItem > 0 ? `R$ ${valorTotalItem.toFixed(2)}` : 'R$ 0,00'}</p>
                    </div>
                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors mb-0.5"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-between items-center pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={handleAddItem} className="text-xs h-8 bg-white" disabled={loading}>
              + Adicionar Item
            </Button>

            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-bold mr-2">Total Geral</span>
              <span className="text-xl font-bold text-green-600">R$ {totalGeral.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className={labelStyle}>Justificativa (Opcional)</label>
          <textarea
            className="w-full px-4 py-3 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all h-24"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Caso tenha usado o cartão de outro veículo ou ocorrido algo incomum..."
            disabled={loading}
          ></textarea>
        </div>

        <Button
          type="submit"
          disabled={loading}
          isLoading={loading}
          className="w-full py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          {loading ? 'Validando...' : 'Registrar Abastecimento'}
        </Button>
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
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