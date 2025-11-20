import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Componentes
import { IniciarJornada } from '../components/IniciarJornada';
import { RegistrarAbastecimento } from '../components/RegistrarAbastecimento';
import { JornadaCard } from '../components/JornadaCard';
import { AdminDashboard } from '../components/AdminDashboard';
import { GestaoJornadas } from '../components/GestaoJornadas'; 
import { FormRegistrarManutencao } from '../components/forms/FormRegistrarManutencao';
import { DashboardRelatorios } from '../components/DashboardRelatorios';
import { PainelAlertas } from '../components/PainelAlertas';
import { RankingOperadores } from '../components/RankingOperadores';
import { HistoricoAbastecimentos } from '../components/HistoricoAbastecimentos';
import { HistoricoManutencoes } from '../components/HistoricoManutencoes';
import { Button } from '../components/ui/Button';

// Estilos
const abaAtivaStyle = "inline-block p-4 text-primary border-b-2 border-primary rounded-t-lg active";
const abaInativaStyle = "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300";

type AbaEncarregado = 'alertas' | 'dashboard' | 'ranking' | 'jornadas' | 'abastecimento' | 'hist_abastecimento' | 'manutencao' | 'hist_manutencao';

export function Dashboard() {
  const { user, logout } = useAuth();
  
  // Recupera token para passar aos componentes filhos que ainda não foram refatorados
  const token = localStorage.getItem('authToken') || '';

  // Estados dos dados mestre
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [error, setError] = useState(''); 
  const [loadingDados, setLoadingDados] = useState(true); 

  // Estados específicos de ROLES
  const [jornadasOperador, setJornadasOperador] = useState<any[]>([]);
  const [jornadasAbertasGestao, setJornadasAbertasGestao] = useState<any[]>([]);

  // Estado da aba
  const [abaEncarregado, setAbaEncarregado] = useState<AbaEncarregado>('alertas');

  useEffect(() => {
    let isMounted = true;
    const carregarDados = async () => {
      setLoadingDados(true);
      try {
        setError('');
        
        // Definimos as requisições base
        const requisicoesBase = [
          api.get('/users'),
          api.get('/veiculos'),
          api.get('/produtos'),
          api.get('/fornecedores'),
        ];
        
        let requisicoes = [...requisicoesBase];
        
        // Adicionamos requisições específicas por perfil
        if (user?.role === 'OPERADOR') {
          requisicoes.push(api.get('/jornadas/minhas-abertas-operador')); 
        }
        if (user?.role === 'ENCARREGADO') {
          requisicoes.push(api.get('/jornadas/abertas'));
        }

        const respostas = await Promise.all(requisicoes);
        if (!isMounted) return;

        setUsuarios(respostas[0].data);
        setVeiculos(respostas[1].data);
        setProdutos(respostas[2].data);
        setFornecedores(respostas[3].data);

        if (user?.role === 'OPERADOR' && respostas.length > 4) {
          setJornadasOperador(respostas[4].data || []); 
        }
        if (user?.role === 'ENCARREGADO' && respostas.length > 4) {
           setJornadasAbertasGestao(respostas[4].data || []);
        }

      } catch (err: any) {
         if (!isMounted) return;
         console.error("Erro ao carregar dados:", err);
         if (err.response?.status === 401 || err.response?.status === 403) {
           setError('Sessão expirada.');
           logout();
         } else {
            setError('Falha ao carregar dados do servidor.');
         }
      } finally {
         if (isMounted) setLoadingDados(false);
      }
    };

    if (user) {
        carregarDados();
    }
    return () => { isMounted = false; };
  }, [user, logout]);

  // Callbacks
  const handleJornadaIniciada = (novaJornada: any) => {
      setJornadasOperador(prev => [...prev, novaJornada]);
  };
  const handleJornadaFinalizada = (jornadaId: string) => {
      setJornadasOperador(prev => prev.filter(j => j.id !== jornadaId));
      setJornadasAbertasGestao(prev => prev.filter(j => j.id !== jornadaId));
  };

  // --- RENDERIZAÇÃO ---
  if (!user) return null; // Should be handled by PrivateRoute but safety check

  const renderDashboardContent = () => {
    if (loadingDados) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
           <p className="text-text-secondary font-medium">A carregar sistema...</p>
        </div>
      );
    }
    
    // 1. OPERADOR
    if (user.role === 'OPERADOR') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface shadow-card rounded-card p-6 border border-gray-100">
            <IniciarJornada
                token={token}
                usuarios={usuarios} 
                veiculos={veiculos} 
                operadorLogadoId={user.id} 
                onJornadaIniciada={handleJornadaIniciada}
                jornadasAtivas={jornadasOperador} 
            />
          </div>
          <div className="space-y-6">
            {jornadasOperador.length === 0 && (
                <div className="bg-surface shadow-sm rounded-card p-8 text-center border border-dashed border-gray-300">
                    <p className="text-text-secondary">Você não possui nenhuma jornada em aberto.</p>
                </div>
            )}
            {jornadasOperador.map(jornada => (
              <JornadaCard 
                  key={jornada.id}
                  token={token}
                  jornada={jornada}
                  onJornadaFinalizada={() => handleJornadaFinalizada(jornada.id)}
              />
            ))}
          </div>
        </div>
      );
    }

    // 2. ENCARREGADO
    if (user.role === 'ENCARREGADO') {
      const renderAbaEncarregado = () => {
         switch (abaEncarregado) {
           case 'alertas': return <PainelAlertas token={token} />;
           case 'dashboard': return <DashboardRelatorios token={token} veiculos={veiculos} />;
           case 'ranking': return <RankingOperadores token={token} />;
           case 'jornadas': return <GestaoJornadas token={token} jornadasAbertas={jornadasAbertasGestao} onJornadaFinalizadaManualmente={handleJornadaFinalizada} />;
           case 'abastecimento': return <RegistrarAbastecimento token={token} usuarios={usuarios} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
           case 'hist_abastecimento': return <HistoricoAbastecimentos token={token} userRole={user.role} veiculos={veiculos} />;
           case 'manutencao': return <FormRegistrarManutencao token={token} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
           case 'hist_manutencao': return <HistoricoManutencoes token={token} userRole={user.role} veiculos={veiculos} />;
           default: return null;
         }
      };

      return (
         <div className="bg-surface shadow-card rounded-card min-h-[600px] flex flex-col">
            <div className="border-b border-gray-200 overflow-x-auto">
              <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center min-w-max px-2">
                {[
                  {id: 'alertas', label: 'Alertas'},
                  {id: 'dashboard', label: 'Dashboard'},
                  {id: 'ranking', label: 'Ranking'},
                  {id: 'jornadas', label: 'Gestão Jornadas'},
                  {id: 'abastecimento', label: 'Abastecimento'},
                  {id: 'hist_abastecimento', label: 'Hist. Abastecimento'},
                  {id: 'manutencao', label: 'Manutenção'},
                  {id: 'hist_manutencao', label: 'Hist. Manutenção'},
                ].map((aba) => (
                   <li key={aba.id} className="mr-2">
                    <button 
                        className={abaEncarregado === aba.id ? abaAtivaStyle : abaInativaStyle} 
                        onClick={() => setAbaEncarregado(aba.id as AbaEncarregado)}
                    >
                        {aba.label}
                    </button>
                   </li>
                ))}
              </ul>
            </div>
            <div className="p-6 flex-1">
              {renderAbaEncarregado()}
            </div>
         </div>
      );
    }
    
    // 3. ADMIN
    if (user.role === 'ADMIN') {
      return (
        <AdminDashboard
            token={token}
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
            adminUserId={user.id}
        />
      );
    }

    return <p className="text-center p-4">Perfil não reconhecido.</p>;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                    <span className="font-bold text-xl tracking-tight text-primary hidden sm:block">KLIN Frota</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-text">{user.nome}</p>
                        <p className="text-xs text-text-secondary font-bold uppercase">{user.role}</p>
                    </div>
                    <Button variant="secondary" onClick={logout} className="!py-2">Sair</Button>
                </div>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
            </div>
        )}
        {renderDashboardContent()}
      </main>
    </div>
  );
}