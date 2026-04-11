/**
 * validateAbastecimento.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Funções puras de validação de negócio para abastecimentos.
 * Separadas da UI para reutilização em formulários de registro E edição.
 *
 * Regras baseadas nos limites operacionais reais da frota KLIN (contrato Braskem/CASE):
 *  - Custo total de um único abastecimento raramente ultrapassa R$ 5.000,00
 *  - Diesel S10 em postos da região: R$ 5,50 – R$ 7,50/L
 *  - Tanques variam de ~200L (utilitário) a ~800L (poliguindaste)
 *  - KM abastecido é sempre >= odômetro anterior (já validado no backend)
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ItemAbastecimentoBase {
  quantidade: number;
  valorPorUnidade: number;
}

export interface AnomaliaAbastecimento {
  /** Código único para identificar a anomalia no log/alerta */
  codigo: string;
  /** Mensagem amigável exibida ao usuário */
  mensagem: string;
  /** 'warning' → pede confirmação; 'error' → bloqueia envio */
  nivel: 'warning' | 'error';
}

// ─── Limites de Negócio ───────────────────────────────────────────────────────

const LIMITES = {
  /** Valor mínimo razoável para preço do litro (R$) */
  PRECO_LITRO_MIN: 4.00,
  /** Valor máximo razoável para preço do litro (R$) */
  PRECO_LITRO_MAX: 9.00,
  /** Quantidade máxima de litros em um único abastecimento (tanque do maior caminhão) */
  LITROS_MAX: 1000,
  /** Custo total que dispara aviso de anomalia (R$) */
  CUSTO_ALERTA: 5_000,
  /** Custo total absoluto que bloqueia o envio no frontend (R$) — backend também bloqueia */
  CUSTO_BLOQUEIO: 50_000,
} as const;

// ─── Função Principal ─────────────────────────────────────────────────────────

/**
 * Valida um abastecimento e retorna uma lista de anomalias encontradas.
 * Lista vazia = nenhum problema detectado.
 */
export function validarAbastecimento(
  itens: ItemAbastecimentoBase[],
  custoTotal: number
): AnomaliaAbastecimento[] {
  const anomalias: AnomaliaAbastecimento[] = [];

  // ── 1. Custo Total (Hard Block) ─────────────────────────────────────────────
  if (custoTotal > LIMITES.CUSTO_BLOQUEIO) {
    anomalias.push({
      codigo: 'CUSTO_BLOQUEIO',
      mensagem: `O custo total de ${formatarMoeda(custoTotal)} ultrapassa o limite máximo de ${formatarMoeda(LIMITES.CUSTO_BLOQUEIO)}. Verifique os valores digitados.`,
      nivel: 'error',
    });
  }

  // ── 2. Custo Total (Soft Warning) ───────────────────────────────────────────
  else if (custoTotal > LIMITES.CUSTO_ALERTA) {
    anomalias.push({
      codigo: 'CUSTO_ALTO',
      mensagem: `O custo total é ${formatarMoeda(custoTotal)}. Isso é incomum para um único abastecimento. Confirme se os valores estão corretos.`,
      nivel: 'warning',
    });
  }

  // ── 3. Validações por item ──────────────────────────────────────────────────
  itens.forEach((item, i) => {
    const num = i + 1;

    // Preço unitário fora do intervalo esperado
    if (item.valorPorUnidade > 0 && item.valorPorUnidade < LIMITES.PRECO_LITRO_MIN) {
      anomalias.push({
        codigo: `PRECO_BAIXO_${i}`,
        mensagem: `Item ${num}: Preço unitário ${formatarMoeda(item.valorPorUnidade)}/L parece muito baixo (mínimo esperado: ${formatarMoeda(LIMITES.PRECO_LITRO_MIN)}/L).`,
        nivel: 'warning',
      });
    }

    if (item.valorPorUnidade > LIMITES.PRECO_LITRO_MAX) {
      anomalias.push({
        codigo: `PRECO_ALTO_${i}`,
        mensagem: `Item ${num}: Preço unitário ${formatarMoeda(item.valorPorUnidade)}/L parece muito alto (máximo esperado: ${formatarMoeda(LIMITES.PRECO_LITRO_MAX)}/L).`,
        nivel: 'warning',
      });
    }

    // Quantidade de litros fora do normal
    if (item.quantidade > LIMITES.LITROS_MAX) {
      anomalias.push({
        codigo: `LITROS_ALTO_${i}`,
        mensagem: `Item ${num}: ${item.quantidade}L é mais do que a capacidade máxima esperada (${LIMITES.LITROS_MAX}L). Confirme a quantidade.`,
        nivel: 'warning',
      });
    }
  });

  return anomalias;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Verifica se existem anomalias que bloqueiam o envio (nivel 'error') */
export function temBloqueio(anomalias: AnomaliaAbastecimento[]): boolean {
  return anomalias.some((a) => a.nivel === 'error');
}

/** Verifica se existem apenas avisos (requerem confirmação do usuário) */
export function temAvisos(anomalias: AnomaliaAbastecimento[]): boolean {
  return anomalias.some((a) => a.nivel === 'warning') && !temBloqueio(anomalias);
}
