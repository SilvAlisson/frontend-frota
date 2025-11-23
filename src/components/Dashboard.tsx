import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

// Novos Componentes Separados
import { DashboardOperador } from '../components/DashboardOperador';
import { DashboardEncarregado } from '../components/DashboardEncarregado';
import { AdminDashboard } from '../components/AdminDashboard';

export function Dashboard() {
    const { user, logout } = useAuth();
    const token = localStorage.getItem('authToken') || '';

    // Dados Globais
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [veiculos, setVeiculos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [fornecedores, setFornecedores] = useState<any[]>([]);

    // Dados Específicos
    const [jornadasOperador, setJornadasOperador] = useState<any[]>([]);
    const [jornadasAbertasGestao, setJornadasAbertasGestao] = useState<any[]>([]);

    const [loadingDados, setLoadingDados] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const carregarDados = async () => {
            if (!user) return;
            setLoadingDados(true);
            try {
                // Promise.all para paralelizar requests
                const requests = [
                    api.get('/users'),
                    api.get('/veiculos'),
                    api.get('/produtos'),
                    api.get('/fornecedores'),
                ];

                if (user.role === 'OPERADOR') requests.push(api.get('/jornadas/minhas-abertas-operador'));
                if (user.role === 'ENCARREGADO') requests.push(api.get('/jornadas/abertas'));

                const responses = await Promise.all(requests);
                if (!isMounted) return;

                setUsuarios(responses[0].data);
                setVeiculos(responses[1].data);
                setProdutos(responses[2].data);
                setFornecedores(responses[3].data);

                if (user.role === 'OPERADOR' && responses[4]) setJornadasOperador(responses[4].data);
                if (user.role === 'ENCARREGADO' && responses[4]) setJornadasAbertasGestao(responses[4].data);

            } catch (err: any) {
                console.error("Erro ao carregar dados:", err);
                if (err.response?.status === 401) logout();
                else setError('Não foi possível carregar os dados do sistema.');
            } finally {
                if (isMounted) setLoadingDados(false);
            }
        };

        carregarDados();
        return () => { isMounted = false; };
    }, [user, logout]);

    // Handlers de Atualização Local
    const handleJornadaIniciada = (nova: any) => setJornadasOperador(prev => [...prev, nova]);
    const handleJornadaFinalizada = (id: string) => {
        setJornadasOperador(prev => prev.filter(j => j.id !== id));
        setJornadasAbertasGestao(prev => prev.filter(j => j.id !== id));
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar Simples */}
            <nav className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100 h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                        <span className="font-bold text-xl tracking-tight text-primary hidden sm:block">KLIN Frota</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-text">{user.nome}</p>
                            <span className="text-xs font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {user.role}
                            </span>
                        </div>
                        <Button variant="secondary" onClick={logout} className="!py-2 text-xs">Sair</Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-error rounded-lg">{error}</div>}

                {loadingDados ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-70">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4"></div>
                        <p className="text-gray-500 font-medium">A sincronizar frota...</p>
                    </div>
                ) : (
                    <>
                        {user.role === 'OPERADOR' && (
                            <DashboardOperador
                                token={token} user={user} usuarios={usuarios} veiculos={veiculos}
                                jornadasAtivas={jornadasOperador}
                                onJornadaIniciada={handleJornadaIniciada} onJornadaFinalizada={handleJornadaFinalizada}
                            />
                        )}

                        {user.role === 'ENCARREGADO' && (
                            <DashboardEncarregado
                                token={token} user={user} veiculos={veiculos} usuarios={usuarios} produtos={produtos} fornecedores={fornecedores}
                                jornadasAbertas={jornadasAbertasGestao} onJornadaFinalizada={handleJornadaFinalizada}
                            />
                        )}

                        {user.role === 'ADMIN' && (
                            <AdminDashboard
                                token={token} adminUserId={user.id}
                                veiculos={veiculos} produtos={produtos} fornecedores={fornecedores}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}