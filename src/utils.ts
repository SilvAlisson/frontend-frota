import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- FORMATAÇÃO INTELIGENTE DE KM ---

/**
 * A MÁGICA DO SISTEMA:
 * Analisa o valor digitado e compara com o histórico do veículo.
 * Se o valor for absurdamente alto (erro de dedo gordo esquecendo a vírgula),
 * ele divide por 10 automaticamente.
 * * Ex: Histórico = 95.000
 * Input = 955102 (Esqueceu a virgula) -> Detecta salto gigante -> Corrige para 95510.2
 */
export const parseKmInteligente = (inputStr: string, ultimoKmHistorico?: number): number => {
  const valorDigitado = parseDecimal(inputStr);

  // Se não temos histórico (veículo novo ou primeira carga), confiamos no que foi digitado
  if (!ultimoKmHistorico || ultimoKmHistorico === 0) return valorDigitado;

  // LÓGICA DE DEDUÇÃO:
  // Se o valor digitado for maior que 1.5x o último KM (um salto impossível de 50%),
  // assumimos que é um erro de casa decimal (esqueceu a vírgula).
  if (valorDigitado > ultimoKmHistorico * 1.5) {
    const tentativaCorrecao = valorDigitado / 10;

    // Agora verificamos se a correção faz sentido:
    // 1. O valor corrigido tem que ser MAIOR que o histórico (km não volta)
    // 2. A diferença não pode ser absurda (ex: limitamos a 5.000km/dia, que já é muito)
    if (tentativaCorrecao >= ultimoKmHistorico) {
      const diferenca = tentativaCorrecao - ultimoKmHistorico;

      // Se a diferença corrigida for plausível (menos de 5000km), aplicamos a correção!
      if (diferenca < 5000) {
        console.log(`🔮 Auto-correção de KM ativada: ${valorDigitado} -> ${tentativaCorrecao}`);
        return tentativaCorrecao;
      }
    }
  }

  return valorDigitado;
};

// --- FUNÇÕES BASE (Mantidas e Otimizadas) ---

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

export const parseDecimal = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Aceita tanto ponto quanto vírgula, mas prioriza a vírgula como decimal
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