import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- FUNÇÕES DE ESTILO (DESIGN SYSTEM) ---

/**
 * Função CN (ClassNames):
 * Remove conflitos do Tailwind e junta classes condicionalmente.
 * Essencial para os componentes visuais (Button, Card, Input).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- FORMATADORES FINANCEIROS ---

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

// --- FORMATAÇÃO INTELIGENTE DE KM ---

/**
 * A MÁGICA DO SISTEMA:
 * Analisa o valor digitado e compara com o histórico do veículo.
 * Se o valor for absurdamente alto (erro de dedo gordo esquecendo a vírgula),
 * ele divide por 10 automaticamente.
 */
export const parseKmInteligente = (inputStr: string, ultimoKmHistorico?: number): number => {
  const valorDigitado = parseDecimal(inputStr);

  if (!ultimoKmHistorico || ultimoKmHistorico === 0) return valorDigitado;

  if (valorDigitado > ultimoKmHistorico * 1.5) {
    const tentativaCorrecao = valorDigitado / 10;
    if (tentativaCorrecao >= ultimoKmHistorico) {
      const diferenca = tentativaCorrecao - ultimoKmHistorico;
      if (diferenca < 5000) {
        console.log(`🔮 Auto-correção de KM ativada: ${valorDigitado} -> ${tentativaCorrecao}`);
        return tentativaCorrecao;
      }
    }
  }

  return valorDigitado;
};

// --- FUNÇÕES BASE ---

export const parseDecimal = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

export const formatKmVisual = (value: string | number): string => {
  if (!value && value !== 0) return '';
  let v = String(value).replace(/[^\d,]/g, '');

  const parts = v.split(',');
  if (parts.length > 2) {
    v = parts[0] + ',' + parts.slice(1).join('');
  }

  const [integerPart, decimalPart] = v.split(',');
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (v.includes(',')) {
    const decimalLimitado = decimalPart ? decimalPart.substring(0, 1) : '';
    return `${integerFormatted},${decimalLimitado}`;
  }

  return integerFormatted;
};

// --- EXCEL EXPORT ---

export const exportarParaExcel = async (data: any[], nomeArquivo: string) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dados');

    if (data.length > 0) {
      const colunas = Object.keys(data[0]).map(key => ({
        header: key.toUpperCase(),
        key: key,
        width: 25
      }));
      worksheet.columns = colunas;

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      worksheet.addRows(data);

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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileNameFull = nomeArquivo.endsWith('.xlsx') ? nomeArquivo : `${nomeArquivo}.xlsx`;
    saveAs(blob, fileNameFull);

  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    alert("Ocorreu um erro ao gerar o arquivo Excel.");
  }
};

// --- UTILITÁRIOS SOBRENATURAIS ---

export const isJornadaFantasma = (jornada: any): boolean => {
  if (!jornada || !jornada.observacoes) return false;
  return jornada.observacoes.includes('FANTASMA_INICIO') ||
    jornada.observacoes.includes('FANTASMA_FIM') ||
    jornada.observacoes.includes('👻');
};

export const getNomeFantasma = (observacoes?: string | null): string => {
  if (!observacoes) return 'Entidade Desconhecida';
  if (observacoes.includes("FANTASMA_INICIO")) return "Esqueceram de Abrir";
  if (observacoes.includes("FANTASMA_FIM")) return "Esqueceram de Fechar";
  const match = observacoes.match(/👻 (.*?)(?=\s+assumiu|:|\.|$)/i);
  return match ? match[1].trim() : 'Assombração';
};