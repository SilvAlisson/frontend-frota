import { useState, useEffect } from 'react';
import axios from 'axios';
import { IniciarJornada } from './components/IniciarJornada';
import { RegistrarAbastecimento } from './components/RegistrarAbastecimento';
import { JornadaCard } from './components/JornadaCard';
import { AdminDashboard } from './components/AdminDashboard';
import { GestaoJornadas } from './components/GestaoJornadas'; 
import { FormRegistrarManutencao } from './components/forms/FormRegistrarManutencao';
import { DashboardRelatorios } from './components/DashboardRelatorios';
import { PainelAlertas } from './components/PainelAlertas';
import { RankingOperadores } from './components/RankingOperadores';
const RENDER_API_BASE_URL = 'https://api-frota-klin.onrender.com/api';


// ===================================================================
// INTERFACES E CONSTANTES DE ESTILO
// ===================================================================
interface DashboardProps {
  session: { token: string; user: any }; 
  onLogout: () => void;
}

// Estilos das abas
const abaAtivaStyle = "inline-block p-4 text-klin-azul border-b-2 border-klin-azul rounded-t-lg active";
const abaInativaStyle = "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300";

// ================== Adicionar 'ranking' às abas ==================
type AbaEncarregado = 'alertas' | 'dashboard' | 'ranking' | 'jornadas' | 'abastecimento' | 'manutencao';


// ===================================================================
// DASHBOARD
// ===================================================================
function Dashboard({ session, onLogout }: DashboardProps) {
  const { token, user } = session;

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


  // Efeito para carregar TODOS os dados mestre
  useEffect(() => {
    const api = axios.create({
      baseURL: RENDER_API_BASE_URL, 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let isMounted = true;
    const carregarDados = async () => {
      setLoadingDados(true);
      try {
        setError('');
        
        const requisicoesBase = [
          api.get('/users'),
          api.get('/veiculos'),
          api.get('/produtos'),
          api.get('/fornecedores'),
        ];
        
        let requisicoes = [...requisicoesBase];
        
        if (user.role === 'OPERADOR') {
          requisicoes.push(api.get('/jornadas/minhas-abertas-operador')); 
        }
        if (user.role === 'ENCARREGADO') {
          requisicoes.push(api.get('/jornadas/abertas'));
        }

        const respostas = await Promise.all(requisicoes);
        if (!isMounted) return;

        setUsuarios(respostas[0].data);
        setVeiculos(respostas[1].data);
        setProdutos(respostas[2].data);
        setFornecedores(respostas[3].data);

        if (user.role === 'OPERADOR' && respostas.length > 4) {
          setJornadasOperador(respostas[4].data || []); 
        }
        if (user.role === 'ENCARREGADO' && respostas.length > 4) {
           setJornadasAbertasGestao(respostas[4].data || []);
        }

      } catch (err) {
         if (!isMounted) return;
         console.error("Erro ao carregar dados do Dashboard:", err);
         if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
           const errorMsg = err.response?.data?.error || 'Sua sessão expirou ou não está autorizada.';
           setError(errorMsg); 
           setTimeout(() => { if (isMounted) onLogout(); }, 2000); 
         } else {
            setError('Falha ao carregar dados do servidor.');
         }
      } finally {
         if (isMounted) setLoadingDados(false);
      }
    };
    carregarDados();
    return () => { isMounted = false; };
  }, [token, onLogout, user.role]);


  // Callbacks de Jornada
  const handleJornadaIniciada = (novaJornada: any) => {
      setJornadasOperador(prevJornadas => [...prevJornadas, novaJornada]);
  };
  const handleJornadaFinalizada = (jornadaId: string) => {
      setJornadasOperador(prevJornadas => prevJornadas.filter(j => j.id !== jornadaId));
      setJornadasAbertasGestao(prevJornadas => prevJornadas.filter(j => j.id !== jornadaId));
  };

  // --- FUNÇÃO DE RENDERIZAÇÃO DE CONTEÚDO ---
  const renderDashboardContent = () => {
    if (loadingDados) {
      return <p className="text-center text-klin-azul font-semibold text-lg py-10">Carregando dados...</p>;
    }
    
    // --- 1. FLUXO DO OPERADOR ---
    if (user.role === 'OPERADOR') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
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
                <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                    Você não possui jornadas em aberto.
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

    // --- 2. FLUXO DO ENCARREGADO ---
    if (user.role === 'ENCARREGADO') {
      
      // Função para renderizar o conteúdo da aba correta
      const renderAbaEncarregado = () => {
         switch (abaEncarregado) {
           case 'alertas':
             return <PainelAlertas token={token} />;
           case 'dashboard':
             return <DashboardRelatorios token={token} veiculos={veiculos} />;
           
           // ================== Adicionar o 'case' do ranking ==================
           case 'ranking':
             return <RankingOperadores token={token} />;
             
           case 'jornadas':
             return (
                <GestaoJornadas
                  token={token}
                  jornadasAbertas={jornadasAbertasGestao} 
                  onJornadaFinalizadaManualmente={handleJornadaFinalizada}
                />
             );
           case 'abastecimento':
             return (
                <RegistrarAbastecimento
                  token={token}
                  usuarios={usuarios}
                  veiculos={veiculos}
                  produtos={produtos}
                  fornecedores={fornecedores}
                />
             );
           case 'manutencao':
              return (
                <FormRegistrarManutencao
                  token={token}
                  veiculos={veiculos}
                  produtos={produtos}
                  fornecedores={fornecedores}
                />
              );
           default:
             return null;
         }
      };

      return (
        // O 'card' principal que engloba tudo
         <div className="bg-white shadow rounded-lg p-6">
            
            {/* Os botões das Abas */}
            <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 mb-6">
              <ul className="flex flex-wrap -mb-px">
                
                <li className="mr-2">
                  <button 
                    type="button"
                    className={abaEncarregado === 'alertas' ? abaAtivaStyle : abaInativaStyle}
                    onClick={() => setAbaEncarregado('alertas')}
                  >
                    Alertas
                  </button>
                </li>
                <li className="mr-2">
                  <button 
                    type="button"
                    className={abaEncarregado === 'dashboard' ? abaAtivaStyle : abaInativaStyle}
                    onClick={() => setAbaEncarregado('dashboard')}
                  >
                    Dashboard (KPIs)
                  </button>
                </li>
                
                {/* ================== Adicionar o botão da aba ================== */}
                <li className="mr-2">
                  <button 
                    type="button"
                    className={abaEncarregado === 'ranking' ? abaAtivaStyle : abaInativaStyle}
                    onClick={() => setAbaEncarregado('ranking')}
                  >
                    Ranking (KM/L)
                  </button>
                </li>
                {}

                <li className="mr-2">
                  <button 
                    type="button"
                    className={abaEncarregado === 'jornadas' ? abaAtivaStyle : abaInativaStyle}
                    onClick={() => setAbaEncarregado('jornadas')}
                  >
                    Gestão de Jornadas
                  </button>
                </li>
                <li className="mr-2">
                  <button 
                    type="button"
                    className={abaEncarregado === 'abastecimento' ? abaAtivaStyle : abaInativaStyle}
                    onClick={() => setAbaEncarregado('abastecimento')}
                  >
                    Registar Abastecimento
                  </button>
                </li>
                <li className="mr-2">
                  <button 
                    type="button"
                    className={abaEncarregado === 'manutencao' ? abaAtivaStyle : abaInativaStyle}
                    onClick={() => setAbaEncarregado('manutencao')}
                  >
                    Registar Manutenção/Lavagem
                  </button>
                </li>
              </ul>
            </div>

            {/* O conteúdo da aba ativa */}
            <div>
              {renderAbaEncarregado()}
            </div>
         </div>
      );
    }
    
    // --- 3. FLUXO DO ADMIN ---
    if (user.role === 'ADMIN') {
      return (
        <AdminDashboard
            token={token}
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
        />
      );
    }

    // Fallback
    return <p>Role de usuário desconhecida.</p>;
  };


  // --- Restante do App.tsx (Navbar, LoginScreen, App) ---

  return (
    <div className="min-h-screen bg-klin-gelo">
      {/* Navbar ... */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 flex items-center">
                    <img src="/logo.png" alt="Logo KLIN" className="h-10 w-auto" />
                </div>
                <div className="flex items-center">
                    <span className="text-gray-600 mr-4 text-sm sm:text-base hidden sm:inline">
                      Olá, {user.nome} (<span className="font-bold text-klin-azul uppercase">{user.role}</span>)
                    </span>
                    <button
                      onClick={onLogout}
                      className="bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-klin-azul"
                    >
                      Sair
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* Conteúdo Principal ... */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center mb-4">{error}</p>}
        {renderDashboardContent()}
      </main>
    </div>
  );
}

// ===================================================================
// TELA DE LOGIN
// ===================================================================
function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (loginData: { token: string; user: any }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true); 

    try {
      const response = await axios.post(`${RENDER_API_BASE_URL}/auth/login`, {
        email: email,
        password: password
      });
      onLoginSuccess(response.data); 
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        console.error('Falha no login:', err.response.data.error || err.message);
        setError(err.response.data.error || 'Credenciais inválidas ou erro no servidor.');
      } else {
        console.error('Erro de conexão ou outro erro:', err);
        setError('Não foi possível conectar ao servidor.');
      }
    } finally {
        setLoading(false); 
    }
  };

  // JSX da Tela de Login
  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-klin-gelo p-4">
        <img src="/logo.png" alt="Logo KLIN" className="w-40 mb-6" />
        <h2 className="text-2xl font-semibold text-klin-azul mb-6">
          Gestão de Frota
        </h2>
        <form
          className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200"
              type="email"
              placeholder="seu.email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Senha</label>
            <input
              id="password"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && (
            <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-center">
            <button
              className="bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              type="submit"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
         <p className="text-center text-gray-500 text-xs mt-4">
            &copy;{new Date().getFullYear()} KLIN. Todos os direitos reservados.
         </p>
      </div>
  );
}


// ===================================================================
// COMPONENTE PRINCIPAL (APP) (Gerencia a sessão)
// ===================================================================
function App() {
  const [userSession, setUserSession] = useState<{ token: string; user: any } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true); 

  useEffect(() => {
    const tokenSalvo = localStorage.getItem('authToken');
    const userSalvo = localStorage.getItem('authUser');
    if (tokenSalvo && userSalvo) {
      try {
        const user = JSON.parse(userSalvo);
        setUserSession({ token: tokenSalvo, user: user });
      } catch (e) {
         localStorage.clear();
      }
    }
    setLoadingSession(false);
  }, []);

  const handleLogin = (loginData: { token: string; user: any }) => {
    setUserSession(loginData);
    localStorage.setItem('authToken', loginData.token);
    localStorage.setItem('authUser', JSON.stringify(loginData.user));
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  if (loadingSession) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-klin-gelo">
              <span className="text-klin-azul font-semibold text-lg">Carregando...</span>
          </div>
      );
  }

  return (
    <div>
      {userSession ? (
        <Dashboard session={userSession} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLogin} />
      )}
    </div>
  );
}

export default App;