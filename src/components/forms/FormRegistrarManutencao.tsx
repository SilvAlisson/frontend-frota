import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../services/api'; // Usamos a api global configurada
// Importar as funções que criámos no utils.ts
import { parseDecimal, formatKmVisual } from '../../utils';

// Estilos reutilizáveis
const labelStyle = "block mb-1.5 text-sm font-medium text-text-secondary";
const inputStyle = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";

// Tipos
interface FormRegistrarManutencaoProps {
  token: string; // Mantido por compatibilidade, mas usamos api.ts
  veiculos: any[];
  produtos: any[];
  fornecedores: any[];
}
interface ItemManutencao {
  produtoId: string;
  quantidade: string;
  valorPorUnidade: string;
}

const tiposDeManutencao = ["PREVENTIVA", "CORRETIVA", "LAVAGEM"];

export function FormRegistrarManutencao({
  veiculos,
  produtos,
  fornecedores
}: FormRegistrarManutencaoProps) {

  // Estados dos campos
  const [veiculoId, setVeiculoId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState('CORRETIVA');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemManutencao[]>([
    { produtoId: '', quantidade: '1', valorPorUnidade: '' }
  ]);

  // Novo estado para validação
  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0);

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  // --- EFEITO: Buscar último KM ao selecionar veículo ---
  useEffect(() => {
    if (!veiculoId) {
      setUltimoKmRegistrado(0);
      return;
    }

    const fetchVeiculoInfo = async () => {
      try {
        // Chama a API para pegar os detalhes do veículo (incluindo ultimoKm)
        const response = await api.get(`/veiculo/${veiculoId}`);
        if (response.data && response.data.ultimoKm) {
          setUltimoKmRegistrado(response.data.ultimoKm);
        } else {
          setUltimoKmRegistrado(0);
        }
      } catch (err) {
        console.error("Erro ao buscar info do veículo:", err);
      }
    };
    fetchVeiculoInfo();
  }, [veiculoId]);

  // --- Handler para formatar KM visualmente ---
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmAtual(formatKmVisual(e.target.value));
  };

  // Helpers de Itens
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // 1. Validação de KM Real (Segurança)
    const kmInputFloat = parseDecimal(kmAtual);
    if (kmInputFloat < ultimoKmRegistrado) {
      setError(`O KM inserido (${kmInputFloat}) não pode ser menor que o último registado (${ultimoKmRegistrado} KM).`);
      setLoading(false);
      return;
    }

    // 2. Validação de Campos Obrigatórios
    if (!veiculoId || !fornecedorId || !kmAtual || !data || !tipo ||
      itens.some(item => !item.produtoId || !item.valorPorUnidade)) {
      setError('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        // Se for LAVAGEM, forçamos quantidade 1, senão usamos o que foi digitado
        quantidade: tipo === 'LAVAGEM' ? 1 : parseDecimal(item.quantidade),
        valorPorUnidade: parseDecimal(item.valorPorUnidade)
      }));

      const dadosCompletosDoFormulario = {
        veiculoId,
        fornecedorId,
        kmAtual: kmInputFloat, // Envia o número limpo (float)
        data: new Date(data).toISOString(),
        tipo,
        observacoes: DOMPurify.sanitize(observacoes) || null,
        itens: itensFormatados
      };

      setFormDataParaModal(dadosCompletosDoFormulario);
      setModalAberto(true);

    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      setError('Falha ao preparar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setSuccess('Manutenção registada com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);

    // Reset do form
    setVeiculoId('');
    setFornecedorId('');
    setKmAtual('');
    setData(new Date().toISOString().slice(0, 10));
    setTipo('CORRETIVA');
    setObservacoes('');
    setItens([{ produtoId: '', quantidade: '1', valorPorUnidade: '' }]);
    setUltimoKmRegistrado(0);
  };

  const produtosFiltrados = produtos.filter(p => p.tipo === 'SERVICO' || p.tipo === 'OUTRO');

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* CABEÇALHO */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">Registar Manutenção</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* VEÍCULO */}
          <div>
            <label className={labelStyle}>Veículo</label>
            <div className="relative">
              <select className={inputStyle} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
              </select>
            </div>
            {/* Feedback visual do último KM */}
            {ultimoKmRegistrado > 0 && (
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Último KM: <strong>{ultimoKmRegistrado.toLocaleString('pt-BR')}</strong>
              </p>
            )}
          </div>

          <div>
            <label className={labelStyle}>Oficina / Lava-Rápido</label>
            <div className="relative">
              <select className={inputStyle} value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          </div>

          {/* KM ATUAL COM FORMATAÇÃO */}
          <div>
            <label className={labelStyle}>KM Atual</label>
            <Input
              type="text"
              inputMode="numeric"
              value={kmAtual}
              onChange={handleKmChange}
              placeholder={ultimoKmRegistrado > 0 ? `Maior que ${ultimoKmRegistrado}` : "Ex: 50.420"}
              // Fica vermelho se o valor for inválido
              className={parseDecimal(kmAtual) > 0 && parseDecimal(kmAtual) < ultimoKmRegistrado ? "border-red-500 text-red-600 focus:ring-red-200" : ""}
            />
          </div>

          <Input label="Data do Serviço" type="date" value={data} onChange={(e) => setData(e.target.value)} />

          {/* TIPO DE SERVIÇO */}
          <div>
            <label className={labelStyle}>Tipo de Serviço</label>
            <div className="relative">
              <select className={inputStyle} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {tiposDeManutencao.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS */}
        <div className="bg-gray-50 p-4 rounded-card border border-gray-200 mt-6">
          <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">
            Serviços Realizados
          </h4>

          <div className="space-y-3">
            {itens.map((item, index) => {
              const qtd = tipo === 'LAVAGEM' ? 1 : parseDecimal(item.quantidade);
              const valUn = parseDecimal(item.valorPorUnidade);
              const total = qtd * valUn;

              return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded-md shadow-sm border border-gray-100">

                  {/* PRODUTO/SERVIÇO */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Serviço</label>
                    <select
                      className={inputStyle + " py-2 text-sm"}
                      value={item.produtoId}
                      onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>

                  {/* QUANTIDADE (Oculta se for Lavagem) */}
                  {tipo !== 'LAVAGEM' && (
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
                  )}

                  {/* VALOR (Expande se for Lavagem) */}
                  <div className={tipo === 'LAVAGEM' ? "sm:col-span-4" : "sm:col-span-2"}>
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Valor</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="R$"
                      className="!py-2 text-right text-sm"
                      value={item.valorPorUnidade}
                      onChange={(e) => handleItemChange(index, 'valorPorUnidade', e.target.value)}
                    />
                  </div>

                  {/* TOTAL E REMOVER */}
                  <div className="sm:col-span-3 flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {total > 0 ? `R$ ${total.toFixed(2)}` : 'R$ 0,00'}
                    </span>
                    {itens.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-1">
                        X
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={handleAddItem} className="text-xs">
              + Adicionar Item
            </Button>
          </div>
        </div>

        <div className="pt-4">
          <label className={labelStyle}>Observações</label>
          <textarea
            className={inputStyle + " h-24 resize-none"}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descreva detalhes..."
          ></textarea>
        </div>

        {error && <p className="text-center text-error bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
        {success && <p className="text-center text-success bg-green-50 p-3 rounded-md border border-green-200">{success}</p>}

        <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
          {loading ? 'A Validar...' : 'Registar Serviço'}
        </Button>
      </form>

      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={""} // Não é mais necessário passar token aqui, o axios global trata
          titulo="Envie o Comprovativo"
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