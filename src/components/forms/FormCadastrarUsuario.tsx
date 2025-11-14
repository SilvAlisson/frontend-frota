// frontend/src/components/forms/FormCadastrarUsuario.tsx
import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';

// Classes reutilizáveis
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

export function FormCadastrarUsuario({ token }: { token: string }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState('ENCARREGADO'); // Padrão para "Encarregado"

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!nome || !email || !password || !role) {
      setError('Nome, Email, Senha e Função são obrigatórios.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // Chama a rota de registo do back-end
      await api.post('/user/register', {
        nome: DOMPurify.sanitize(nome),
        email: DOMPurify.sanitize(email),
        password: password, // O back-end fará o hash
        matricula: DOMPurify.sanitize(matricula) || null,
        role: role, 
      });
      setSuccess(`Usuário ${nome} (${role}) cadastrado com sucesso!`);
      // Limpa o formulário
      setNome('');
      setEmail('');
      setPassword('');
      setMatricula('');
      setRole('ENCARREGADO');
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className={labelStyle}>Nome Completo</label>
        <input type="text" className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <label className={labelStyle}>Email</label>
        <input type="email" className={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className={labelStyle}>Senha Provisória</label>
        <input type="password" className={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label className={labelStyle}>Matrícula (Opcional)</label>
        <input type="text" className={inputStyle} value={matricula} onChange={(e) => setMatricula(e.target.value)} />
      </div>
      <div>
        <label className={labelStyle}>Função (Role)</label>
        <select className={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
            {/* Como Admin, você pode criar Encarregados ou Operadores */}
            <option value="ENCARREGADO">Encarregado</option>
            <option value="OPERADOR">Operador</option>
            {/* O Admin não deve poder criar outro Admin por este formulário (segurança) */}
        </select>
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
      {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}

      <button type="submit" className={buttonStyle} disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
      </button>
    </form>
  );
}