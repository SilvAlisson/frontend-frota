import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Alerta } from '../types'; // Assumindo que Alerta está em types.ts

interface PainelAlertasProps { }

// Assumindo interface se não estiver no global types
// interface Alerta {
//   tipo: 'DOCUMENTO' | 'MANUTENCAO';
//   nivel: 'VENCIDO' | 'ATENCAO';
//   mensagem: string;
// }

function IconeAlerta({ tipo, nivel }: { tipo: Alerta['tipo']; nivel: Alerta['nivel'] }) {
  const config = nivel === 'VENCIDO'
    ? { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' }
    : { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' };

  const iconPath = tipo === 'MANUTENCAO'
    ? "M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10"
    : "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z";

  return (
    <div className={`p-2.5 rounded-xl ${config.bg} ${config.text} ring-1 ${config.ring} flex-shrink-0 shadow-sm`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
    </div>
  );
}

export function PainelAlertas({ }: PainelAlertasProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAlertas = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/relatorios/alertas');
        setAlertas(response.data);
      } catch (err) {
        console.error("Erro ao buscar alertas:", err);
        setError('Não foi possível verificar o estado da frota.');
        toast.error('Falha ao carregar alertas.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlertas();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-60">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary mb-3"></div>
        <p className="text-text-secondary text-sm font-medium animate-pulse">Analisando frota...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-100 text-center">
        <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-3 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
        </div>
        <p className="text-red-800 font-medium text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-red-600 hover:underline">Tentar novamente</button>
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-green-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="p-4 bg-green-50 rounded-full shadow-inner mb-4 ring-8 ring-green-50/50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-900">Tudo em dia!</h3>
        <p className="text-sm text-green-700 mt-1 text-center max-w-[250px]">
          Nenhuma manutenção ou documento pendente na frota.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Painel de Atenção
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </h3>
        <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-100 shadow-sm">
          {alertas.length} Pendências
        </span>
      </div>

      <div className="grid gap-3">
        {alertas.map((alerta, index) => {
          const isVencido = alerta.nivel === 'VENCIDO';
          return (
            <div
              key={index}
              className={`
                group relative overflow-hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100 
                hover:shadow-md transition-all duration-200 flex items-start gap-4
                ${isVencido ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500'}
              `}
            >
              <IconeAlerta tipo={alerta.tipo} nivel={alerta.nivel} />

              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isVencido ? 'text-red-600' : 'text-amber-600'}`}>
                    {alerta.tipo === 'MANUTENCAO' ? 'Manutenção Necessária' : 'Documentação'}
                  </span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${isVencido ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {alerta.nivel}
                  </span>
                </div>
                <p className="text-gray-800 text-sm font-medium leading-snug">
                  {alerta.mensagem}
                </p>
              </div>

              {/* Indicador de Ação (Seta sutil) */}
              <div className="self-center text-gray-300 group-hover:text-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}