import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStatusInfo, getStatusBadge } from '../documentUtils';

describe('documentUtils', () => {
  beforeEach(() => {
    // Mock the current date to '2024-05-15' for deterministic testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getStatusInfo', () => {
    it('returns Permanente for LICENCA_AMBIENTAL without validade', () => {
      const result = getStatusInfo(null, 'LICENCA_AMBIENTAL');
      expect(result.text).toBe('Vigente (Permanente)');
      expect(result.color).toContain('bg-success');
    });

    it('returns Permanente for AST without validade', () => {
      const result = getStatusInfo(null, 'AST');
      expect(result.text).toBe('Vigente (Permanente)');
    });

    it('returns Sem data for generic category without validade', () => {
      const result = getStatusInfo(null, 'OUTRO');
      expect(result.text).toBe('Sem data');
      expect(result.color).toContain('text-text-muted');
    });

    it('returns Vencido for past dates', () => {
      const result = getStatusInfo('2024-05-10T00:00:00.000Z');
      expect(result.text).toContain('Venceu a 10/05/2024');
      expect(result.color).toContain('bg-error');
      expect(result.color).toContain('animate-pulse');
    });

    it('returns Vence em breve for dates within 30 days', () => {
      // 15th to 30th is 15 days
      const result = getStatusInfo('2024-05-30T00:00:00.000Z');
      expect(result.text).toContain('Vence em 16 dias');
      expect(result.color).toContain('bg-warning');
    });

    it('returns Vigente for dates further than 30 days', () => {
      const result = getStatusInfo('2024-08-01T00:00:00.000Z');
      expect(result.text).toContain('Vence a 01/08/2024');
      expect(result.color).toContain('bg-success');
    });
  });

  describe('getStatusBadge', () => {
    it('returns ARQUIVADO styling when status is ARQUIVADO', () => {
      const result = getStatusBadge('ARQUIVADO');
      expect(result.text).toBe('ARQUIVADO');
      expect(result.color).toContain('opacity-70');
    });

    it('returns VIGENTE styling for other statuses', () => {
      const result = getStatusBadge('ATIVO');
      expect(result.text).toBe('VIGENTE');
      expect(result.color).toContain('text-primary');
    });

    it('returns VIGENTE styling when status is undefined', () => {
      const result = getStatusBadge(undefined);
      expect(result.text).toBe('VIGENTE');
    });
  });
});
