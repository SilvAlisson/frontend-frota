// frontend/src/components/forms/FormCadastrarFornecedor.tsx
import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';

// Classes reutilizáveis
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

export function FormCadastrarFornecedor({ token }: { token: string }) {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!nome) {
      setError('O Nome é obrigatório.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: 'https://api-frota-klin.onrender.com',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // Chama a rota POST /api/fornecedor do seu backend
      await api.post('/fornecedor', {
        nome: DOMPurify.sanitize(nome),
        cnpj: DOMPurify.sanitize(cnpj) || null, // CNPJ é opcional no schema
      });
      setSuccess(`Fornecedor ${nome} cadastrado com sucesso!`);
      // Limpa o formulário
      setNome('');
      setCnpj('');
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className={labelStyle}>Nome do Fornecedor (Posto)</label>
        <input type="text" className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: POSTO QUARTO DE MILHA LTDA" />
      </div>
      
      <div>
        <label className={labelStyle}>CNPJ (Opcional)</label>
        <input type="text" className={inputStyle} value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
      {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}

      <button type="submit" className={buttonStyle} disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
      </button>
    </form>
  );
}