import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
// MUDANÇA: Importar componentes UI
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function FormCadastrarVeiculo({ token }: { token: string }) {
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');

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
      await api.post('/veiculo', {
        placa: DOMPurify.sanitize(placa.toUpperCase()),
        modelo: DOMPurify.sanitize(modelo),
        ano: parseInt(ano),
        tipoVeiculo: DOMPurify.sanitize(tipoVeiculo),
        vencimentoCiv: vencimentoCiv || null,
        vencimentoCipp: vencimentoCipp || null,
      });

      setSuccess(`Veículo ${placa.toUpperCase()} cadastrado com sucesso!`);
      
      setPlaca('');
      setModelo('');
      setAno('');
      setTipoVeiculo('');
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
    <form className="space-y-5" onSubmit={handleSubmit}>
      
      {/* Grid Responsivo para os campos principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          placeholder="ABC1D23"
          disabled={loading}
        />
        <Input
          label="Modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="Ex: VW Constellation"
          disabled={loading}
        />
        <Input
          label="Tipo de Caminhão"
          value={tipoVeiculo}
          onChange={(e) => setTipoVeiculo(e.target.value)}
          placeholder="Poliguindaste, Munck..."
          disabled={loading}
        />
        <Input
          label="Ano"
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="2020"
          disabled={loading}
        />
      </div>

      {/* Secção de Documentação */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wide text-center md:text-left">
            Controle de Documentação (Opcional)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vencimento CIV"
              type="date"
              value={vencimentoCiv}
              onChange={(e) => setVencimentoCiv(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Vencimento CIPP"
              type="date"
              value={vencimentoCipp}
              onChange={(e) => setVencimentoCipp(e.target.value)}
              disabled={loading}
            />
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-error px-4 py-3 rounded-md text-center text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-success px-4 py-3 rounded-md text-center text-sm font-medium">
          {success}
        </div>
      )}

      {/* Botão de Ação */}
      <div className="pt-2">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full" 
            disabled={loading}
            isLoading={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
          </Button>
      </div>
    </form>
  );
}