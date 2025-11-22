// Declara a variável global XLSX que vem do script CDN no index.html
//
declare const XLSX: any;

/**
 * Exporta um array de dados JSON para um ficheiro Excel (XLSX).
 * @param data Array de objectos a exportar.
 * @param nomeFicheiro O nome do ficheiro (ex: "relatorio.xlsx").
 */
export const exportarParaExcel = (data: any[], nomeFicheiro: string) => {
  try {
    // 1. Criar a "worksheet" (planilha) a partir dos dados JSON
    const ws = XLSX.utils.json_to_sheet(data);

    // 2. Criar um novo "workbook" (pasta de trabalho)
    const wb = XLSX.utils.book_new();

    // 3. Adicionar a planilha ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Dados"); // O nome da aba será "Dados"

    // 4. Iniciar o download do ficheiro
    XLSX.writeFile(wb, nomeFicheiro);

  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    alert("Ocorreu um erro ao tentar exportar o ficheiro Excel.");
  }
};

/**
 * Converte uma string visual (ex: "50.420") para número puro (50420)
 */
export const parseDecimal = (value: string): number => {
  if (!value) return 0;
  // Remove pontos de milhar e troca vírgula por ponto (se houver)
  const parsableValue = value.toString().replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(parsableValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata visualmente enquanto digita (Ex: 1000 -> 1.000)
 */
export const formatKmVisual = (value: string | number) => {
  if (!value) return "";
  const stringValue = value.toString();
  // Remove tudo que não é dígito
  const numbers = stringValue.replace(/\D/g, "");
  // Adiciona pontos de milhar
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};