import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Veiculo } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { FormCadastrarVeiculo } from './forms/FormCadastrarVeiculo';
import { FormEditarVeiculo } from './forms/FormEditarVeiculo';
import { TableStyles } from '../styles/table';
import { toast } from 'sonner';

// Ícones
function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}

export function GestaoVeiculos() {
  const navigate = useNavigate();
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [veiculoParaEditar, setVeiculoParaEditar] = useState<Veiculo | null>(null);
  const [busca, setBusca] = useState('');

  const { data: veiculos, isLoading, refetch } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: async () => {
      const response = await api.get('/veiculos');
      return response.data;
    }
  });

  const veiculosFiltrados = veiculos?.filter(v =>
    v.placa.toLowerCase().includes(busca.toLowerCase()) ||
    v.modelo.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Remover este veículo apagará todo o histórico associado. Continuar?")) return;
    try {
      await api.delete(`/veiculos/${id}`);
      toast.success("Veículo removido com sucesso");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover veículo");
    }
  };

  if (isCadastroOpen) {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsCadastroOpen(false)}>
          <span>← Voltar para listagem</span>
        </div>
        {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border max-w-2xl mx-auto">
          <FormCadastrarVeiculo
            onSuccess={() => { setIsCadastroOpen(false); refetch(); }}
            onCancelar={() => setIsCadastroOpen(false)}
          />
        </div>
      </div>
    );
  }

  if (veiculoParaEditar) {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary transition-colors" onClick={() => setVeiculoParaEditar(null)}>
          <span>← Voltar para listagem</span>
        </div>
        {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border max-w-2xl mx-auto">
          <FormEditarVeiculo
            veiculoId={veiculoParaEditar.id}
            onSuccess={() => { setVeiculoParaEditar(null); refetch(); }}
            onCancelar={() => setVeiculoParaEditar(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Frota</h1>
          <p className="text-gray-500 text-sm">Gerencie os equipamentos e o prontuário dos veículos.</p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="flex-1 md:w-64">
            <Input
              placeholder="Buscar placa ou modelo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button onClick={() => setIsCadastroOpen(true)} className="whitespace-nowrap">
            + Novo Veículo
          </Button>
        </div>
      </div>

      {/* LISTAGEM */}
      {isLoading ? (
        <div className="space-y-3">
          {/* [PADRONIZAÇÃO] bg-gray-50 -> bg-background, border-gray-100 -> border-border */}
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-background rounded-lg animate-pulse border border-border" />)}
        </div>
      ) : (
        <ListaResponsiva
          itens={veiculosFiltrados}
          emptyMessage="Nenhum veículo encontrado."
          desktopHeader={
            // [PADRONIZAÇÃO] Substituição por classes do TableStyles
            <>
              <th className={TableStyles.th}>Placa</th>
              <th className={TableStyles.th}>Modelo / Ano</th>
              <th className={TableStyles.th}>Combustível</th>
              <th className={TableStyles.th}>Status</th>
              <th className={`${TableStyles.th} text-right`}>Ações</th>
            </>
          }
          renderDesktop={(v) => (
            <>
              {/* [PADRONIZAÇÃO] Substituição por classes do TableStyles */}
              <td className={TableStyles.td}>
                {/* BOTÃO DA PLACA: Navega para o Prontuário */}
                <button
                  onClick={() => navigate(`/admin/veiculos/${v.id}`)}
                  className="font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded text-sm border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  {v.placa}
                </button>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{v.modelo}</span>
                  <span className="text-xs text-gray-500">{v.ano} • {v.tipoVeiculo || 'N/A'}</span>
                </div>
              </td>
              <td className={`${TableStyles.td} text-gray-600`}>
                {v.tipoCombustivel.replace(/_/g, ' ')}
              </td>
              <td className={TableStyles.td}>
                <BadgeStatus status={v.status} />
              </td>
              <td className={`${TableStyles.td} text-right`}>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    // [PADRONIZAÇÃO] Cores alinhadas à marca (hover:text-primary)
                    className="h-8 w-8 !p-0 text-gray-400 hover:text-primary hover:bg-primary/10"
                    onClick={() => setVeiculoParaEditar(v)}
                    title="Editar Cadastro"
                  >
                    <IconeEditar />
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(v.id)}
                    title="Excluir Veículo"
                  >
                    <IconeLixo />
                  </Button>
                </div>
              </td>
            </>
          )}
          renderMobile={(v) => (
            <div className="p-4" onClick={() => navigate(`/admin/veiculos/${v.id}`)}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-primary">{v.placa}</span>
                    <BadgeStatus status={v.status} mini />
                  </div>
                  <h3 className="font-medium text-gray-900">{v.modelo}</h3>
                  <p className="text-xs text-gray-500">{v.tipoVeiculo} • {v.ano}</p>
                </div>
                {/* Botões mobile */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setVeiculoParaEditar(v)} className="p-2 text-gray-400"><IconeEditar /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-2 text-gray-400"><IconeLixo /></button>
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

function BadgeStatus({ status, mini }: { status: string, mini?: boolean }) {
  const map = {
    'ATIVO': 'bg-green-100 text-green-700 border-green-200',
    'EM_MANUTENCAO': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'INATIVO': 'bg-gray-100 text-gray-500 border-gray-200'
  };
  const style = map[status as keyof typeof map] || map['INATIVO'];
  if (mini) return <span className={`w-2 h-2 rounded-full ${style.split(' ')[0].replace('bg-', 'bg-')}`} />;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}