import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PainelAlertasProps { }

interface Alerta {
  tipo: 'DOCUMENTO' | 'MANUTENCAO';
  nivel: 'VENCIDO' | 'ATENCAO';
  mensagem: string;
}

function IconeAlerta({ tipo, nivel }: { tipo: Alerta['tipo']; nivel: Alerta['nivel'] }) {
  const cor = nivel === 'VENCIDO' ? 'text-red-600' : 'text-amber-600';
  const bgCor = nivel === 'VENCIDO' ? 'bg-red-100' : 'bg-amber-100';

  const iconPath = tipo === 'MANUTENCAO'
    ? "M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10"
    : "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z";

  return (
    <div className={`p-2.5 rounded-full ${bgCor} flex-shrink-0 shadow-sm`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${cor}`}>
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
        const response = await api.get('/alertas');
        setAlertas(response.data);
      } catch (err) {
        console.error("Erro ao buscar alertas:", err);
        setError('Não foi possível carregar os alertas no momento.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlertas();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
        <p className="text-text-secondary text-sm">verificando estado da frota...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-center text-error text-sm font-medium">{error}</div>;
  }

  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-green-100 border-dashed">
        <div className="p-3 bg-green-50 rounded-full shadow-sm mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-green-800">Tudo em dia!</h3>
        <p className="text-sm text-green-600 mt-1">Nenhum alerta pendente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-primary">Painel de Atenção</h3>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {alertas.length} Pendências
        </span>
      </div>
      <div className="grid gap-3">
        {alertas.map((alerta, index) => {
          const isVencido = alerta.nivel === 'VENCIDO';
          return (
            <div key={index} className={`relative overflow-hidden bg-white p-4 rounded-lg shadow-sm border-l-4 flex items-start gap-4 transition-all hover:shadow-md ${isVencido ? 'border-l-red-500' : 'border-l-amber-500'}`}>
              <IconeAlerta tipo={alerta.tipo} nivel={alerta.nivel} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wide ${isVencido ? 'text-red-600' : 'text-amber-600'}`}>
                    {alerta.tipo === 'MANUTENCAO' ? 'Manutenção' : 'Documentação'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isVencido ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {alerta.nivel}
                  </span>
                </div>
                <p className="text-text text-sm font-medium leading-snug">{alerta.mensagem}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}