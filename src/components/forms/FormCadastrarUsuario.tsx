import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
// MUDANÇA: Componentes UI
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
    <form className="space-y-5" onSubmit={handleSubmit}>
      <h4 className="text-lg font-bold text-primary text-center">
        Adicionar Novo Utilizador
      </h4>

      <Input label="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Senha Provisória" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input label="Matrícula (Opcional)" value={matricula} onChange={(e) => setMatricula(e.target.value)} />

      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-600">Função (Role)</label>
        <select 
          className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={role} 
          onChange={(e) => setRole(e.target.value)}
        >
            <option value="ENCARREGADO">Encarregado</option>
            <option value="OPERADOR">Operador</option>
        </select>
      </div>

      {error && <p className="text-center text-sm text-error bg-red-50 p-2 rounded">{error}</p>}

      <div className="flex gap-4 pt-2">
        <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
          Cadastrar
        </Button>
      </div>
    </form>
  );
}