export const getLoadingMessages = (pergunta: string): string[] => {
  const p = pergunta.toLowerCase();
  if (p.match(/defeito|manuten|quebra|peça|oficina|pneu|óleo/)) 
      return ['Buscando histórico de OS', 'Analisando defeitos', 'Calculando custos mecânicos'];
  if (p.match(/abastecimento|combust|litro|km|gasto|diesel|gasolina/)) 
      return ['Analisando abastecimentos', 'Calculando KM/L', 'Cruzando rotas'];
  if (p.match(/treinamento|venc|documento|cnh|sst|operador/)) 
      return ['Acessando matriz de documentos', 'Verificando validades', 'Analisando SST'];
  
  return ['Analisando banco de dados', 'Cruzando métricas', 'Inspecionando transações'];
};
