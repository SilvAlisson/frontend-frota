import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { DadosEvolucaoKm } from '../types';

export function useVeiculoDetalhes(id?: string) {
  const navigate = useNavigate();
  const [veiculo, setVeiculo] = useState<any>(null);
  const [dadosKm, setDadosKm] = useState<DadosEvolucaoKm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      setLoading(true);
      try {
        const resDetalhes = await api.get(`/veiculos/${id}/detalhes`);
        setVeiculo(resDetalhes.data);

        // Try getting charts data independently so it doesn't fail the whole page
        try {
          const resGrafico = await api.get(`/relatorios/evolucao-km?veiculoId=${id}&dias=7`);
          setDadosKm(resGrafico.data || []);
        } catch (graphErr) {
          console.warn("Falha no gráfico, carregando resto da página.");
          setDadosKm([]);
        }

      } catch (err) {
        console.error("Erro crítico na API:", err);
        toast.error("Não foi possível carregar o prontuário.");
        navigate('/admin/veiculos');
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [id, navigate]);

  return { veiculo, dadosKm, loading };
}


