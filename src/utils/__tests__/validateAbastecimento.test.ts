import { describe, it, expect } from 'vitest';
import { validarAbastecimento, temBloqueio } from '../validateAbastecimento';

describe('validateAbastecimento', () => {
  it('returns empty array for valid abastecimento', () => {
    const itens = [{ quantidade: 100, valorPorUnidade: 5.50 }];
    const anomalias = validarAbastecimento(itens, 550);
    expect(anomalias).toHaveLength(0);
  });

  it('detects CUSTO_BLOQUEIO error when total cost > 50_000', () => {
    const itens = [{ quantidade: 100, valorPorUnidade: 5.50 }];
    const anomalias = validarAbastecimento(itens, 50001);
    expect(anomalias).toHaveLength(1);
    expect(anomalias[0].codigo).toBe('CUSTO_BLOQUEIO');
    expect(anomalias[0].nivel).toBe('error');
    expect(temBloqueio(anomalias)).toBe(true);
  });

  it('detects CUSTO_ALTO warning when total cost > 5_000 but <= 50_000', () => {
    const itens = [{ quantidade: 1000, valorPorUnidade: 6 }];
    const anomalias = validarAbastecimento(itens, 6000);
    expect(anomalias).toHaveLength(1);
    expect(anomalias[0].codigo).toBe('CUSTO_ALTO');
    expect(anomalias[0].nivel).toBe('warning');
    expect(temBloqueio(anomalias)).toBe(false);
  });

  it('detects PRECO_BAIXO warning when price < 4.00', () => {
    const itens = [{ quantidade: 100, valorPorUnidade: 3.50 }];
    const anomalias = validarAbastecimento(itens, 350);
    expect(anomalias).toHaveLength(1);
    expect(anomalias[0].codigo).toBe('PRECO_BAIXO_0');
    expect(anomalias[0].nivel).toBe('warning');
  });

  it('detects PRECO_ALTO warning when price > 9.00', () => {
    const itens = [{ quantidade: 100, valorPorUnidade: 10 }];
    const anomalias = validarAbastecimento(itens, 1000);
    expect(anomalias).toHaveLength(1);
    expect(anomalias[0].codigo).toBe('PRECO_ALTO_0');
  });

  it('detects LITROS_ALTO warning when quantity > 1000', () => {
    const itens = [{ quantidade: 1500, valorPorUnidade: 5 }];
    const anomalias = validarAbastecimento(itens, 7500);
    // Should have both CUSTO_ALTO and LITROS_ALTO
    expect(anomalias).toHaveLength(2);
    expect(anomalias.map(a => a.codigo)).toContain('LITROS_ALTO_0');
    expect(anomalias.map(a => a.codigo)).toContain('CUSTO_ALTO');
  });
});
