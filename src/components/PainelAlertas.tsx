// frontend/src/components/PainelAlertas.tsx
// (Este é um ficheiro NOVO)

import { useState, useEffect } from 'react';
import axios from 'axios';

// Tipos
interface PainelAlertasProps {
  token: string;
}
interface Alerta {
  tipo: 'DOCUMENTO' | 'MANUTENCAO';
  nivel: 'VENCIDO' | 'ATENCAO';
  mensagem: string;
}

// Icone de Alerta (SVG do Tailwind Heroicons)
function IconeAlerta({ nivel }: { nivel: Alerta['nivel'] }) {
  const cor = nivel === 'VENCIDO' ? 'text-red-600' : 'text-yellow-600';
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className={`w-6 h-6 flex-shrink-0 ${cor}`}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
      />
    </svg>
  );
}

export function PainelAlertas({ token }: PainelAlertasProps) {
  
  // Estados
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Efeito para buscar os alertas na API
  useEffect(() => {
    const fetchAlertas = async () => {
      setLoading(true);
      setError('');
      try {
        const api = axios.create({
          baseURL: 'http://localhost:3001/api',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 1. Chamar a rota que criámos no backend
        const response = await api.get('/alertas');
        setAlertas(response.data);

      } catch (err) {
        console.error("Erro ao buscar alertas:", err);
        setError('Falha ao carregar alertas.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertas();
  }, [token]); // Recarrega se o token mudar

  // 2. Renderização
  if (loading) {
    return <p className="text-center text-klin-azul">A verificar alertas...</p>;
  }
  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }
  if (alertas.length === 0) {
    return (
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
        <p className="font-bold">Tudo em dia!</p>
        <p>Nenhum alerta de manutenção ou documentação encontrado.</p>
      </div>
    );
  }

  // 3. Mostrar a lista de alertas
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold text-klin-azul text-center mb-4">
        Painel de Alertas ({alertas.length})
      </h3>
      {alertas.map((alerta, index) => {
        // Define o estilo com base no Nível do alerta
        const isVencido = alerta.nivel === 'VENCIDO';
        const cardStyle = isVencido 
          ? 'bg-red-100 border-red-500 text-red-700' 
          : 'bg-yellow-100 border-yellow-500 text-yellow-700';
        
        return (
          <div key={index} className={`border-l-4 p-4 flex gap-3 ${cardStyle}`} role="alert">
            <IconeAlerta nivel={alerta.nivel} />
            <div>
              <p className="font-bold">
                {alerta.tipo === 'MANUTENCAO' ? 'Manutenção' : 'Documentação'} - {alerta.nivel}
              </p>
              <p>{alerta.mensagem}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}