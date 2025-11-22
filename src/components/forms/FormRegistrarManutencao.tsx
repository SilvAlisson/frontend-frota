import { useState, useEffect } from 'react'; // Adicionado useEffect
import axios from 'axios'; // Necessário para buscar o KM do veículo
import DOMPurify from 'dompurify';
import { ModalConfirmacaoFoto } from '../ModalConfirmacaoFoto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RENDER_API_BASE_URL } from '../../config'; // Importar Config

// Estilos reutilizáveis
const labelStyle = "block mb-1.5 text-sm font-medium text-text-secondary";
const inputStyle = "w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all duration-200";

// Tipos
interface FormRegistrarManutencaoProps {
  token: string;
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

const parseDecimal = (value: string): number => {
  if (!value) return 0;
  const parsableValue = value.replace(/\./g, "").replace(",", "."); // Remove pontos de milhar, troca vírgula
  const parsed = parseFloat(parsableValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Formata visualmente (Ex: 50420 -> 50.420)
const formatKmVisual = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, "");
  // Adiciona pontos de milhar
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export function FormRegistrarManutencao({
  token,
  veiculos,
  produtos,
  fornecedores
}: FormRegistrarManutencaoProps) {

  const [veiculoId, setVeiculoId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState('CORRETIVA');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemManutencao[]>([
    { produtoId: '', quantidade: '1', valorPorUnidade: '' }
  ]);

  const [ultimoKmRegistrado, setUltimoKmRegistrado] = useState<number>(0); // Novo estado

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);

  // --- EFEITO: Buscar último KM ao selecionar veículo ---
  useEffect(() => {
    if (!veiculoId) return;

    const fetchVeiculoInfo = async () => {
      try {
        const api = axios.create({
          baseURL: RENDER_API_BASE_URL,
          headers: { 'Authorization': `Bearer ${token}` }
        });
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
  }, [veiculoId, token]);

  // Manipulação de KM com formatação
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setKmAtual(formatKmVisual(rawValue));
  };

  // Helpers de Itens
  const handleItemChange = (index: number, field: keyof ItemManutencao, value: string) => {
    const novosItens = [...itens];
    novosItens[index][field] = value;
    setItens(novosItens);
  };
  const handleAddItem = () => {
    // Se for lavagem, a quantidade padrão já é 1, mas o campo estará oculto
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

    // 1. Validação de KM (Frontend)
    const kmInputFloat = parseDecimal(kmAtual);
    if (kmInputFloat < ultimoKmRegistrado) {
      setError(`O KM inserido (${kmInputFloat}) é menor que o último registado (${ultimoKmRegistrado} KM). Verifique o odómetro.`);
      setLoading(false);
      return;
    }

    if (!veiculoId || !fornecedorId || !kmAtual || !data || !tipo ||
      itens.some(item => !item.produtoId || !item.quantidade || !item.valorPorUnidade)) {
      setError('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const itensFormatados = itens.map(item => ({
        produtoId: item.produtoId,
        // Se for lavagem, força quantidade 1 se estiver vazia ou oculta, senão usa o valor
        quantidade: tipo === 'LAVAGEM' ? 1 : parseDecimal(item.quantidade),
        valorPorUnidade: parseDecimal(item.valorPorUnidade)
      }));

      const dadosCompletosDoFormulario = {
        veiculoId,
        fornecedorId,
        kmAtual: kmInputFloat,
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
    setSuccess('Registo efetuado com sucesso!');
    setModalAberto(false);
    setFormDataParaModal(null);

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
        <h3 className="text-xl font-semibold text-primary text-center mb-6">
          Registar Manutenção ou Lavagem
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Veículo</label>
            <div className="relative">
              <select className={inputStyle} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
              </select>
            </div>
            {ultimoKmRegistrado > 0 && (
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Último KM: <strong>{ultimoKmRegistrado}</strong>
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

          <div>
            <label className={labelStyle}>KM Atual</label>
            <Input
              // type="text" para permitir formatação visual
              type="text"
              inputMode="numeric"
              value={kmAtual}
              onChange={handleKmChange}
              placeholder={`Maior que ${ultimoKmRegistrado}`}
              // Feedback visual se o valor for menor que o permitido
              className={parseDecimal(kmAtual) > 0 && parseDecimal(kmAtual) < ultimoKmRegistrado ? "border-red-500 text-red-600" : ""}
            />
          </div>

          <Input label="Data do Serviço" type="date" value={data} onChange={(e) => setData(e.target.value)} />

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
            Itens / Serviços
          </h4>

          <div className="space-y-3">
            {itens.map((item, index) => {
              const qtd = tipo === 'LAVAGEM' ? 1 : parseDecimal(item.quantidade);
              const valUn = parseDecimal(item.valorPorUnidade);
              const total = qtd * valUn;

              return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded-md shadow-sm border border-gray-100">

                  {/* SELEÇÃO DO PRODUTO */}
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

                  {/* VALOR (Ocupa mais espaço se for Lavagem) */}
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
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
          token={token}
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