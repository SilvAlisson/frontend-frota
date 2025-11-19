import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
// MUDANÇA: UI
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FormEditarUsuarioProps {
  token: string;
  userId: string;
  onUsuarioEditado: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ token, userId, onUsuarioEditado, onCancelar }: FormEditarUsuarioProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState('ENCARREGADO');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  useEffect(() => {
    if (!userId) return;
    
    const fetchUsuario = async () => {
      setLoadingData(true);
      setError('');
      try {
        const response = await api.get(`/user/${userId}`);
        const user = response.data;
        
        setNome(user.nome || '');
        setEmail(user.email || '');
        setMatricula(user.matricula || '');
        setRole(user.role || 'ENCARREGADO');
        
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError('Falha ao carregar os dados.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchUsuario();
  }, [userId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome || !email || !role) {
      setError('Nome, Email e Função são obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const dataToUpdate: any = {
        nome: DOMPurify.sanitize(nome),
        email: DOMPurify.sanitize(email),
        matricula: DOMPurify.sanitize(matricula) || null,
        role: role, 
      };

      if (password.trim() !== '') {
        dataToUpdate.password = password;
      }

      await api.put(`/user/${userId}`, dataToUpdate);
      onUsuarioEditado();

    } catch (err) {
      console.error("Erro ao atualizar:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao atualizar usuário.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <p className="text-center text-primary py-8">A carregar dados...</p>
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <h4 className="text-lg font-bold text-primary text-center">
        Editar Utilizador
      </h4>
      
      <Input label="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input 
        label="Nova Senha" 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="(Deixe em branco para manter)" 
      />
      <Input label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
      
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
          Guardar
        </Button>
      </div>
    </form>
  );
}