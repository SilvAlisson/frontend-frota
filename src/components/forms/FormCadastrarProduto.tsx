import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
// MUDANÇA: Importar componentes UI
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Tipos de Produto
const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"];

interface FormCadastrarProdutoProps {
  token: string;
  onProdutoAdicionado: () => void;
  onCancelar: () => void;
}

export function FormCadastrarProduto({ token, onProdutoAdicionado, onCancelar }: FormCadastrarProdutoProps) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('COMBUSTIVEL');
  const [unidadeMedida, setUnidadeMedida] = useState('Litro');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome || !tipo) {
      setError('Nome e Tipo são obrigatórios.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      await api.post('/produto', {
        nome: DOMPurify.sanitize(nome),
        tipo: tipo,
        unidadeMedida: DOMPurify.sanitize(unidadeMedida) || 'Litro',
      });
      
      setNome('');
      setTipo('COMBUSTIVEL');
      setUnidadeMedida('Litro');
      onProdutoAdicionado();

    } catch (err) {
      console.error("Erro ao cadastrar produto:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao cadastrar produto.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <h4 className="text-lg font-bold text-primary text-center">
        Adicionar Novo Produto
      </h4>
      
      <Input
        label="Nome do Produto"
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Ex: DIESEL S10"
        disabled={loading}
      />
      
      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-600">Tipo de Produto</label>
        <select 
          className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
          value={tipo} 
          onChange={(e) => setTipo(e.target.value)}
          disabled={loading}
        >
          {tiposDeProduto.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <Input
        label="Unidade de Medida"
        type="text"
        value={unidadeMedida}
        onChange={(e) => setUnidadeMedida(e.target.value)}
        placeholder="Ex: Litro, Unidade, Peça"
        disabled={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-error px-4 py-3 rounded-md text-center text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full" 
          disabled={loading} 
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        
        <Button 
          type="submit" 
          variant="primary" 
          className="w-full" 
          disabled={loading}
          isLoading={loading}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  );
}