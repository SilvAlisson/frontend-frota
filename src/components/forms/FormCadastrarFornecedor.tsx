import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
// MUDANÇA: Importar os novos componentes de UI
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FormCadastrarFornecedorProps {
  token: string;
  onFornecedorAdicionado: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ token, onFornecedorAdicionado, onCancelar }: FormCadastrarFornecedorProps) {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome) {
      setError('O Nome é obrigatório.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      await api.post('/fornecedor', {
        nome: DOMPurify.sanitize(nome),
        cnpj: DOMPurify.sanitize(cnpj) || null,
      });
      
      setNome('');
      setCnpj('');
      onFornecedorAdicionado();

    } catch (err) {
      console.error("Erro ao cadastrar fornecedor:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao cadastrar fornecedor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* MUDANÇA: Título com cor do novo tema */}
      <h4 className="text-lg font-bold text-primary text-center">
        Adicionar Novo Fornecedor
      </h4>

      {/* MUDANÇA: Usar o componente Input padronizado */}
      <Input
        label="Nome do Fornecedor (Posto/Oficina)"
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Ex: POSTO QUARTO DE MILHA LTDA"
        disabled={loading}
      />
      
      <Input
        label="CNPJ (Opcional)"
        type="text"
        value={cnpj}
        onChange={(e) => setCnpj(e.target.value)}
        placeholder="00.000.000/0000-00"
        disabled={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-error px-4 py-3 rounded-md text-center text-sm">
          {error}
        </div>
      )}

      {/* MUDANÇA: Usar o componente Button padronizado */}
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
          {loading ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
        </Button>
      </div>
    </form>
  );
}