import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
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

  // Loading State Visual
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-sm text-text-secondary">A carregar dados do colaborador...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      
      {/* CABEÇALHO COM ÍCONE */}
      <div className="text-center">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
            {/* Ícone de Editar Usuário */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
         </div>
         <h4 className="text-xl font-bold text-primary">
           Editar Colaborador
         </h4>
         <p className="text-sm text-text-secondary mt-1">
           Atualize os dados de acesso e perfil.
         </p>
      </div>

      {/* GRID DE CAMPOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
           <Input label="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} disabled={loading} />
        </div>
        
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <Input label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} disabled={loading} />

        <Input 
          label="Nova Senha" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="(Deixe em branco para manter)" 
          disabled={loading}
        />
        
        {/* Select Customizado */}
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função (Role)</label>
          <div className="relative">
            <select 
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
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

      {/* FEEDBACK DE ERRO */}
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
        <Button type="button" variant="secondary" className="flex-1" disabled={loading} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="flex-1" isLoading={loading}>
          Guardar Alterações
        </Button>
      </div>
    </form>
  );
}