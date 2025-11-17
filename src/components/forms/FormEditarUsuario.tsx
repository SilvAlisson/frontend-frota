import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';

// Estilos (reutilizados)
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";
const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full";

// Tipos
interface FormEditarUsuarioProps {
  token: string;
  userId: string; // O ID do usuário a ser editado
  onUsuarioEditado: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ token, userId, onUsuarioEditado, onCancelar }: FormEditarUsuarioProps) {
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Começa vazio
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState('ENCARREGADO');

  // Estados de controlo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // API com token
  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Efeito para buscar os dados do usuário ao carregar
  useEffect(() => {
    if (!userId) return;
    
    const fetchUsuario = async () => {
      setLoadingData(true);
      setError('');
      try {
        // 1. Usar a nova rota GET /api/user/:id
        const response = await api.get(`/user/${userId}`);
        const user = response.data;
        
        // 2. Popular os estados do formulário
        setNome(user.nome || '');
        setEmail(user.email || '');
        setMatricula(user.matricula || '');
        setRole(user.role || 'ENCARREGADO');
        
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        setError('Falha ao carregar os dados do utilizador para edição.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchUsuario();
  }, [userId, token]); // Depende do userId e token

  // Função de submissão (PUT)
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
      // 3. Preparar os dados para a rota PUT
      const dataToUpdate: any = {
        nome: DOMPurify.sanitize(nome),
        email: DOMPurify.sanitize(email),
        matricula: DOMPurify.sanitize(matricula) || null,
        role: role, 
      };

      // 4. Só enviar a password se ela foi alterada
      if (password.trim() !== '') {
        dataToUpdate.password = password; // O backend fará o hash
      }

      // 5. Chamar a rota PUT
      await api.put(`/user/${userId}`, dataToUpdate);
      
      onUsuarioEditado(); // Chama o callback de sucesso

    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao atualizar usuário.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderização
  if (loadingData) {
    return <p className="text-center text-klin-azul">A carregar dados do utilizador...</p>
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="text-lg font-semibold text-klin-azul text-center">
        Editar Utilizador
      </h4>
      
      {/* Nome */}
      <div>
        <label className={labelStyle}>Nome Completo</label>
        <input type="text" className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      
      {/* Email */}
      <div>
        <label className={labelStyle}>Email</label>
        <input type="email" className={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      
      {/* Password (Opcional) */}
      <div>
        <label className={labelStyle}>Nova Senha</label>
        <input 
          type="password" 
          className={inputStyle} 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="(Deixe em branco para manter a senha atual)"
        />
      </div>
      
      {/* Matrícula */}
      <div>
        <label className={labelStyle}>Matrícula (Opcional)</label>
        <input type="text" className={inputStyle} value={matricula} onChange={(e) => setMatricula(e.target.value)} />
      </div>
      
      {/* Função (Role) */}
      <div>
        <label className={labelStyle}>Função (Role)</label>
        <select className={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ENCARREGADO">Encarregado</option>
            <option value="OPERADOR">Operador</option>
            {/* O Admin não deve poder criar/editar outro Admin por este formulário */}
        </select>
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}

      {/* Botões de ação */}
      <div className="flex gap-4 pt-4">
        <button type="button" className={secondaryButton} disabled={loading} onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className={buttonStyle} disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </form>
  );
}