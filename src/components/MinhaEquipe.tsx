import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ModalQrCode } from './ModalQrCode';
import { toast } from 'sonner';
import type { User, Jornada } from '../types';

interface MinhaEquipeProps {
  usuarios: User[];
  jornadasAbertas: Jornada[];
}

function IconeQrCode() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5ZM14.25 15a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" /></svg>;
}

export function MinhaEquipe({ usuarios, jornadasAbertas }: MinhaEquipeProps) {
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [tokenQr, setTokenQr] = useState<string | null>(null);
  const [nomeQr, setNomeQr] = useState('');
  const [fotoQr, setFotoQr] = useState<string | null | undefined>(null);
  const [roleQr, setRoleQr] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Estado para busca
  const [termoBusca, setTermoBusca] = useState('');

  // Lógica de Filtro e Ordenação
  const operadoresFiltrados = useMemo(() => {
    return usuarios
      .filter(u => {
        // 1. Filtra apenas operadores
        if (u.role !== 'OPERADOR') return false;
        
        // 2. Filtra pelo termo de busca (nome ou email)
        const busca = termoBusca.toLowerCase();
        return (
          u.nome.toLowerCase().includes(busca) || 
          u.email.toLowerCase().includes(busca)
        );
      })
      .sort((a, b) => {
        // 3. Ordenação: Quem está "Em Rota" aparece primeiro
        const aEmRota = jornadasAbertas.some(j => j.operador.id === a.id);
        const bEmRota = jornadasAbertas.some(j => j.operador.id === b.id);

        if (aEmRota && !bEmRota) return -1;
        if (!aEmRota && bEmRota) return 1;
        
        // Desempate por nome
        return a.nome.localeCompare(b.nome);
      });
  }, [usuarios, jornadasAbertas, termoBusca]);

  const handleAcessarCracha = async (user: User) => {
    setLoadingId(user.id);

    // O Backend decide: se já tem token, devolve o antigo. Se não, cria.
    const promise = api.post(`/auth/user/${user.id}/generate-token`);

    toast.promise(promise, {
      loading: 'Buscando credenciais...',
      success: (response) => {
        setTokenQr(response.data.loginToken);
        setNomeQr(user.nome);
        setFotoQr(user.fotoUrl);
        setRoleQr(user.role);
        setModalQrOpen(true);
        setLoadingId(null);
        return `Crachá de ${user.nome.split(' ')[0]} acessado.`;
      },
      error: (err: any) => {
        setLoadingId(null);
        console.error(err);
        // Exibe o erro real do backend (Ex: "Acesso Negado")
        return err.response?.data?.error || 'Erro ao recuperar QR Code.';
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Cabeçalho e Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Minha Equipe</h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie o acesso e status dos motoristas.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Barra de Busca (Melhoria) */}
          <div className="relative w-full sm:w-64">
            <Input 
              placeholder="Buscar motorista..." 
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200 whitespace-nowrap">
            {operadoresFiltrados.length} Motoristas
          </span>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="grid gap-4">
        {operadoresFiltrados.map(op => {
          const jornadaAtiva = jornadasAbertas.find(j => j.operador.id === op.id);

          return (
            <div
              key={op.id}
              className={`group bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                jornadaAtiva ? 'border-green-100 bg-green-50/10' : 'border-gray-100'
              }`}
            >

              {/* Info Motorista */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 border-2 border-white shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative">
                   {/* Indicador visual de status na foto (Bolinha verde se estiver em rota) */}
                   {jornadaAtiva && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-500 z-10" />
                   )}
                   
                  {op.fotoUrl ? (
                    <img src={op.fotoUrl} alt={op.nome} className="w-full h-full object-cover" />
                  ) : (
                    op.nome.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{op.nome}</h4>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{op.email}</p>
                </div>
              </div>

              {/* Status Visual Aprimorado */}
              <div className="flex-1 flex justify-start sm:justify-center w-full sm:w-auto">
                {jornadaAtiva ? (
                  <div className="flex flex-col items-start sm:items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                      </span>
                      Em Rota
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      {jornadaAtiva.veiculo.placa}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-100">
                    Disponível
                  </span>
                )}
              </div>

              {/* Ação */}
              <div className="w-full sm:w-auto flex justify-end">
                <Button
                  variant="secondary"
                  className="text-xs py-2 px-4 h-9 w-full sm:w-auto shadow-sm hover:border-primary/50 hover:text-primary transition-colors"
                  onClick={() => handleAcessarCracha(op)}
                  disabled={loadingId === op.id}
                  isLoading={loadingId === op.id}
                  icon={<IconeQrCode />}
                >
                  {/* Texto condicional interessante: Se já está em rota, provavelmente já tem o crachá */}
                  {jornadaAtiva ? 'Ver Crachá' : 'Acesso QR'}
                </Button>
              </div>
            </div>
          );
        })}

        {operadoresFiltrados.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <p className="text-gray-500 font-medium">Nenhum operador encontrado.</p>
            {termoBusca ? (
              <p className="text-xs text-gray-400 mt-1">Tente buscar por outro nome.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Cadastre novos motoristas no menu de usuários.</p>
            )}
          </div>
        )}
      </div>

      {modalQrOpen && tokenQr && (
        <ModalQrCode
          token={tokenQr}
          nomeUsuario={nomeQr}
          fotoUrl={fotoQr}
          role={roleQr}
          onClose={() => {
            setModalQrOpen(false);
            setTokenQr(null);
            setFotoQr(null);
            setRoleQr('');
          }}
        />
      )}
    </div>
  );
}