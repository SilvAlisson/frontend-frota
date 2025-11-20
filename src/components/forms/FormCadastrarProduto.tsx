import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      
      {/* CABEÇALHO COM ÍCONE */}
      <div className="text-center">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            {/* Ícone de "Caixa/Produto" ou "Gota" dependendo da interpretação, aqui uma caixa genérica */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
         </div>
         <h4 className="text-xl font-bold text-primary">
           Novo Item de Estoque
         </h4>
         <p className="text-sm text-text-secondary mt-1">
           Registe combustíveis, peças ou serviços.
         </p>
      </div>
      
      {/* CAMPOS */}
      <div className="space-y-4">
        <Input
          label="Nome do Produto / Serviço"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: DIESEL S10, ARLA 32, TROCA DE ÓLEO"
          disabled={loading}
        />
        
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo</label>
          <div className="relative">
             <select 
               className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
               value={tipo} 
               onChange={(e) => setTipo(e.target.value)}
               disabled={loading}
             >
               {tiposDeProduto.map(t => (
                 <option key={t} value={t}>{t}</option>
               ))}
             </select>
             {/* Seta customizada para o select ficar bonito */}
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
          </div>
        </div>

        <Input
          label="Unidade de Medida"
          type="text"
          value={unidadeMedida}
          onChange={(e) => setUnidadeMedida(e.target.value)}
          placeholder="Ex: Litro, Unidade, Hora"
          disabled={loading}
        />
      </div>

      {/* MENSAGEM DE ERRO */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
             <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
           </svg>
           <span>{error}</span>
        </div>
      )}

      {/* BOTÕES */}
      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="secondary" 
          className="flex-1" 
          disabled={loading} 
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        
        <Button 
          type="submit" 
          variant="primary" 
          className="flex-1" 
          disabled={loading}
          isLoading={loading}
        >
          {loading ? 'A Registar...' : 'Guardar Produto'}
        </Button>
      </div>
    </form>
  );
}