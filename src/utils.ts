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
    const worksheet = workbook.addWorksheet('Relatório');

    if (data.length > 0) {
      // 1. CONFIGURAR COLUNAS E LARGURA AUTOMÁTICA
      const headers = Object.keys(data[0]);
      const colunas = headers.map(key => {
        // Calcula o tamanho do maior texto daquela coluna para ajustar a largura
        let maxLength = key.length;
        data.forEach(row => {
          const val = row[key] ? row[key].toString() : '';
          if (val.length > maxLength) maxLength = val.length;
        });
        
        return {
          header: key.toUpperCase(),
          key: key,
          width: Math.min(Math.max(maxLength + 5, 15), 50) // Mínimo 15, Máximo 50 de largura
        };
      });
      worksheet.columns = colunas;

      // 2. ESTILIZAR O CABEÇALHO (O segredo para não ficar infinito)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0284C7' } // Azul elegante (sky-600 do Tailwind)
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });

      // 3. INSERIR DADOS (Com suporte a links do ExcelJS)
      const linhasProcessadas = data.map(row => {
        const novaLinha: any = {};
        for (const key in row) {
          let valor = row[key];
          
          if (typeof valor === 'string') {
            // Se o valor for um Hyperlink (que enviamos do componente)
            if (valor.startsWith('=HYPERLINK')) {
              novaLinha[key] = { formula: valor.substring(1) }; // O ExcelJS exige que remova o '=' inicial
            } else {
              // 007 FIX: Prevenção contra CSV/XLS Formula Injection
              if (/^[=\-+\@]/.test(valor)) {
                valor = "'" + valor;
              }
              novaLinha[key] = valor;
            }
          } else {
            novaLinha[key] = valor;
          }
        }
        return novaLinha;
      });

      const rows = worksheet.addRows(linhasProcessadas);

      // 4. ESTILIZAR AS LINHAS (Efeito Zebra)
      rows.forEach((row, index) => {
        row.height = 22;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
          
          // Efeito "Zebra" para linhas pares, melhora a leitura
          if (index % 2 !== 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' } // Cinzento muito claro
            };
          }
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

