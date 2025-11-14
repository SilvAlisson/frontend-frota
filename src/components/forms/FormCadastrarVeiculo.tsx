import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
const RENDER_API_BASE_URL = 'https://api-frota-klin.onrender.com/api';

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

export function FormCadastrarVeiculo({ token }: { token: string }) {
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');

  // Adicionar estados para os novos campos de data
  const [vencimentoCiv, setVencimentoCiv] = useState('');
  const [vencimentoCipp, setVencimentoCipp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // A validação de CIV/CIPP não é obrigatória aqui, pois são opcionais (?)
    if (!placa || !modelo || !ano || !tipoVeiculo) {
      setError('Campos principais (Placa, Modelo, Tipo, Ano) são obrigatórios.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL, 
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // Chama a rota do back-end (que já atualizamos)
      await api.post('/veiculo', {
        placa: DOMPurify.sanitize(placa.toUpperCase()),
        modelo: DOMPurify.sanitize(modelo),
        ano: parseInt(ano),
        tipoVeiculo: DOMPurify.sanitize(tipoVeiculo),
        
        // Envia os novos campos (se vazios, o backend salvará null)
        vencimentoCiv: vencimentoCiv || null,
        vencimentoCipp: vencimentoCipp || null,
      });

      setSuccess(`Veículo ${placa.toUpperCase()} cadastrado com sucesso!`);
      // Limpa o formulário
      setPlaca('');
      setModelo('');
      setAno('');
      setTipoVeiculo('');
      
      // Limpar os novos campos
      setVencimentoCiv('');
      setVencimentoCipp('');

    } catch (err) {
      console.error("Erro ao cadastrar veículo:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao cadastrar veículo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelStyle}>Placa</label>
          <input type="text" className={inputStyle} value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23" />
        </div>
        <div>
          <label className={labelStyle}>Modelo</label>
          <input type="text" className={inputStyle} value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: VW Constellation" />
        </div>
        <div>
          <label className={labelStyle}>Tipo de Caminhão</label>
          <input type="text" className={inputStyle} value={tipoVeiculo} onChange={(e) => setTipoVeiculo(e.target.value)} placeholder="Poliguindaste, Munck..." />
        </div>
        <div>
          <label className={labelStyle}>Ano</label>
          <input type="number" className={inputStyle} value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2020" />
        </div>
      </div>

      {}
      {}
      <div className="pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Controle de Documentação (Opcional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className={labelStyle}>Vencimento CIV</label>
                <input 
                    type="date" 
                    className={inputStyle} 
                    value={vencimentoCiv} 
                    onChange={(e) => setVencimentoCiv(e.target.value)} 
                />
            </div>
            <div>
                <label className={labelStyle}>Vencimento CIPP</label>
                <input 
                    type="date" 
                    className={inputStyle} 
                    value={vencimentoCipp} 
                    onChange={(e) => setVencimentoCipp(e.target.value)} 
                />
            </div>
        </div>
      </div>
      {}

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
      {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}

      <button type="submit" className={buttonStyle + " mt-4"} disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
      </button>
    </form>
  );
}