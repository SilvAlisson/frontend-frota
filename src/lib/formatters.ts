
/**
 * Formata uma string para o padrão de Placa Mercosul (ABC1D23) ou Antiga (ABC-1234)
 */
export const formatarPlaca = (value: string) => {
  if (!value) return '';
  // Remove tudo que não for letra ou número
  const alphanumeric = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  if (alphanumeric.length <= 3) return alphanumeric;
  
  // Se já tiver 4 caracteres ou mais, adiciona o hífen se for placa antiga,
  // ou deixa sem hífen se for mercosul (vamos manter sem hífen por padrão mercosul, 
  // mas o usuário pode digitar, então padronizamos para ABC-1234 para visualização se for número, 
  // e ABC1D23 se for letra na 5ª posição)
  
  const letras = alphanumeric.substring(0, 3);
  const restante = alphanumeric.substring(3, 7); // Pega até 4 caracteres numéricos/alfanuméricos
  
  // Verifica se o 5º caractere (índice 4 original, 1 do restante) é letra ou número
  const eMercosul = isNaN(Number(restante[1]));
  
  if (eMercosul) {
     return `${letras}${restante}`; // ABC1D23 (Sem hífen)
  }
  
  return `${letras}-${restante}`; // ABC-1234 (Com hífen)
};

/**
 * Formata um número para o padrão de Moeda Real (BRL).
 * Aceita número bruto (ex: 1500.5) ou string formatada (ex: "R$ 1.500,00").
 * Uso padrão: formatBRL(1500) → "R$ 1.500,00"
 */
export const formatarDinheiro = (value: string | number) => {
  if (!value) return '';
  
  // Se já for um número do banco de dados (ex: 1500.5), apenas formata
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Remove tudo que não for número (ex: "R$ 1.500,00" -> "150000")
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';

  // Converte para decimal (dividindo por 100)
  const amount = Number(numbers) / 100;

  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Alias direto para formatação de moeda (número -> "R$ X.XXX,XX").
 * Use este nos gráficos e tabelas que recebem `number` puro.
 */
export const formatBRL = (value: number) =>
  (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formata um número inteiro como quilômetros (ex: 152430 → "152.430 KM")
 */
export const formatKm = (value: number) =>
  `${(Number(value) || 0).toLocaleString('pt-BR')} KM`;

/**
 * Formata eficiência km/l (ex: 10.5 → "10,5 km/l")
 */
export const formatKml = (value: number, casas = 1) =>
  `${(Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })} km/l`;

/**
 * Formata um número com separadores pt-BR (ex: 152430 → "152.430")
 */
export const formatNumero = (value: number, casasDecimais = 0) =>
  (Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });

/**
 * Formata custo por km (ex: 2.5 → "R$ 2,50 / km")
 */
export const formatCustoKm = (value: number) => `${formatBRL(value)} / km`;

/**
 * Extrai o valor numérico bruto de uma string formatada como Dinheiro
 * Ex: "R$ 1.500,00" -> 1500.00 (Pronto para salvar no Prisma)
 */
export const desformatarDinheiro = (value: string) => {
  if (!value) return 0;
  // Remove o R$, espaços e os pontos de milhar, troca vírgula por ponto
  const stringNumerica = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return Number(stringNumerica) || 0;
};

/**
 * Formata uma data ISO para o padrão brasileiro (ex: "2025-07-19T14:00:00Z" → "19/07/2025 14:00")
 */
export const formatDataHora = (isoDate: string | Date) => {
  if (!isoDate) return '--/--/----';
  return new Date(isoDate).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata uma data ISO para o padrão de data curta (ex: "19/07/2025")
 */
export const formatData = (isoDate: string | Date) => {
  if (!isoDate) return '--/--/----';
  return new Date(isoDate).toLocaleDateString('pt-BR');
};

