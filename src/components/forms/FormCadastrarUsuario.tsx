import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FormCadastrarUsuarioProps {
  token: string;
  onUsuarioAdicionado: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ token, onUsuarioAdicionado, onCancelar }: FormCadastrarUsuarioProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState('ENCARREGADO');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome || !email || !password || !role) {
      setError('Nome, Email, Senha e Função são obrigatórios.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      await api.post('/user/register', {
        nome: DOMPurify.sanitize(nome),
        email: DOMPurify.sanitize(email),
        password: password,
        matricula: DOMPurify.sanitize(matricula) || null,
        role: role, 
      });
      
      setNome('');
      setEmail('');
      setPassword('');
      setMatricula('');
      onUsuarioAdicionado();

    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao cadastrar usuário.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      
      {/* CABEÇALHO COM ÍCONE */}
      <div className="text-center">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
            {/* Ícone de Usuário/Avatar */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
         </div>
         <h4 className="text-xl font-bold text-primary">
           Novo Colaborador
         </h4>
         <p className="text-sm text-text-secondary mt-1">
           Crie o acesso para um motorista ou gestor.
         </p>
      </div>

      {/* GRID DE CAMPOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome ocupa as duas colunas */}
        <div className="md:col-span-2">
           <Input label="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" disabled={loading} />
        </div>

        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@klin.com" disabled={loading} />
        <Input label="Matrícula (Opcional)" value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="12345" disabled={loading} />
        
        <Input label="Senha Provisória" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" disabled={loading} />

        {/* Select Customizado */}
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função (Role)</label>
          <div className="relative">
            <select 
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
                <option value="OPERADOR">Motorista (Operador)</option>
                <option value="ENCARREGADO">Gestor (Encarregado)</option>
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
          </div>
        </div>
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
            isLoading={loading}
        >
          {loading ? 'Criando...' : 'Criar Acesso'}
        </Button>
      </div>
    </form>
  );
}