import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Jornada } from './types'; // Certifique-se de que a interface Jornada está exportada em types.ts

/**
 * Exporta um array de dados JSON para um arquivo Excel (XLSX) 
 * utilizando ExcelJS (Seguro contra Prototype Pollution e permite estilização).
 */
export const exportarParaExcel = async (data: any[], nomeArquivo: string) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dados');

    if (data.length > 0) {
      // 1. Definir colunas baseadas nas chaves do primeiro objeto
      const colunas = Object.keys(data[0]).map(key => ({
        header: key.toUpperCase(),
        key: key,
        width: 25 // Largura padrão ajustada para melhor leitura
      }));
      worksheet.columns = colunas;

      // 2. Estilizar o cabeçalho (Linha 1)
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' } // Azul Primário (Tailwind blue-600 aprox)
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25; // Altura um pouco maior para o cabeçalho

      // 3. Adicionar os dados
      worksheet.addRows(data);

      // Opcional: Adicionar bordas finas em todas as células preenchidas para acabamento profissional
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }

    // 4. Gerar buffer e disparar download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const fileNameFull = nomeArquivo.endsWith('.xlsx') ? nomeArquivo : `${nomeArquivo}.xlsx`;
    saveAs(blob, fileNameFull);

  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    // Feedback visual simples caso não tenha toast configurado aqui
    alert("Ocorreu um erro ao gerar o arquivo Excel. Verifique o console.");
  }
};

/**
 * Converte uma string visual (ex: "50.420") para número puro (50420)
 * Útil para limpar inputs mascarados antes de enviar para a API.
 */
export const parseDecimal = (value: string): number => {
  if (!value) return 0;
  // Remove pontos de milhar e substitui vírgula decimal por ponto
  const parsableValue = value.toString().replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(parsableValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata visualmente enquanto digita (Ex: 1000 -> 1.000)
 * Adiciona pontos de milhar mas não decimais, ideal para Hodômetro.
 */
export const formatKmVisual = (value: string | number) => {
  if (!value) return "";
  const stringValue = value.toString();
  // Remove tudo que não é dígito
  const numbers = stringValue.replace(/\D/g, "");
  // Regex para adicionar ponto a cada 3 dígitos
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ============================================================================
// 👻 UTILITÁRIOS SOBRENATURAIS (MECÂNICA DE GAMIFICAÇÃO)
// ============================================================================

/**
 * Detecta se a jornada foi assumida pelo sistema "Fantasma" (Bot).
 * Baseado na presença do emoji de fantasma na observação vinda do backend.
 */
export const isJornadaFantasma = (jornada: Jornada): boolean => {
  return !!jornada.observacoes && jornada.observacoes.includes('👻');
};

/**
 * Extrai o nome da entidade da observação para exibição no Dashboard.
 * Ex: "👻 O Fantasma Juca assumiu..." -> Retorna "O Fantasma Juca"
 */
export const getNomeFantasma = (observacoes?: string | null): string => {
  if (!observacoes) return 'Entidade Desconhecida';

  // Regex: Procura o texto entre o emoji 👻 e palavras-chave de fim de frase
  const match = observacoes.match(/👻 (.*?)(?=\s+assumiu|:|\.|$)/i);

  return match ? match[1].trim() : 'Fantasma Tímido';
};