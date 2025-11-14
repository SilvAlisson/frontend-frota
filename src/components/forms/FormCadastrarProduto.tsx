// frontend/src/components/forms/FormCadastrarProduto.tsx
import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';

// Classes reutilizáveis
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

// Tipos de Produto baseados no seu 'schema.prisma'
const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"];

export function FormCadastrarProduto({ token }: { token: string }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('COMBUSTIVEL'); // Padrão

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!nome || !tipo) {
      setError('Nome e Tipo são obrigatórios.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // Chama a rota POST /api/produto do seu backend
      await api.post('/produto', {
        nome: DOMPurify.sanitize(nome),
        tipo: tipo,
        // 'unidadeMedida' usa o padrão 'Litro' do schema
      });
      setSuccess(`Produto ${nome} cadastrado com sucesso!`);
      // Limpa o formulário
      setNome('');
      setTipo('COMBUSTIVEL');
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className={labelStyle}>Nome do Produto</label>
        <input type="text" className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: DIESEL S10" />
      </div>
      
      <div>
        <label className={labelStyle}>Tipo de Produto</label>
        <select className={inputStyle} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {tiposDeProduto.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
      {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}

      <button type="submit" className={buttonStyle} disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
      </button>
    </form>
  );
}