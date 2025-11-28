import { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { ModalQrCode } from './ModalQrCode';
import { TableStyles } from '../styles/table';

// Ícone QR Code
function IconeQrCode() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5ZM14.25 15a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" /></svg>;
}

interface MinhaEquipeProps {
  usuarios: any[];
  jornadasAbertas: any[];
}

export function MinhaEquipe({ usuarios, jornadasAbertas }: MinhaEquipeProps) {
  // Estado para o Modal QR Code
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [tokenQr, setTokenQr] = useState<string | null>(null);
  const [nomeQr, setNomeQr] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  // Filtra apenas operadores
  const operadores = usuarios.filter(u => u.role === 'OPERADOR');

  const handleGerarQrCode = async (userId: string, nome: string) => {
    setLoadingQr(true);
    try {
      const response = await api.post(`/auth/user/${userId}/generate-token`);
      setTokenQr(response.data.loginToken);
      setNomeQr(nome);
      setModalQrOpen(true);
    } catch (err) {
      alert("Erro ao gerar QR Code. Verifique sua conexão.");
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">Minha Equipe de Motoristas</h3>
      
      <div className="overflow-hidden shadow-card rounded-card border border-gray-100 bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={TableStyles.th}>Motorista</th>
              <th className={TableStyles.th}>Status Atual</th>
              <th className={TableStyles.th}>Acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operadores.map(op => {
              // Verifica se o operador está em uma jornada aberta
              const jornadaAtiva = jornadasAbertas.find(j => j.operador.id === op.id);

              return (
                <tr key={op.id} className={TableStyles.rowHover}>
                  <td className={`${TableStyles.td} font-medium`}>
                    {op.nome}
                    <div className="text-xs text-gray-400 font-normal">{op.email}</div>
                  </td>
                  
                  <td className={TableStyles.td}>
                    {jornadaAtiva ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Em Rota: {jornadaAtiva.veiculo.placa}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Disponível / Off
                      </span>
                    )}
                  </td>

                  <td className={TableStyles.td}>
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1 px-3 h-8"
                      onClick={() => handleGerarQrCode(op.id, op.nome)}
                      disabled={loadingQr}
                      icon={<IconeQrCode />}
                    >
                      Gerar QR
                    </Button>
                  </td>
                </tr>
              );
            })}
            
            {operadores.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  Nenhum operador cadastrado na equipe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalQrOpen && tokenQr && (
        <ModalQrCode 
          token={tokenQr} 
          nomeUsuario={nomeQr} 
          onClose={() => { setModalQrOpen(false); setTokenQr(null); }} 
        />
      )}
    </div>
  );
}