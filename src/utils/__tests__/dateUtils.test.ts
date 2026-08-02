import { describe, it, expect } from 'vitest';
import { formatDateDisplay } from '../dateUtils';

describe('formatDateDisplay', () => {
    it('formats UTC ISO string correctly to pt-BR', () => {
        // GREEN: asserting the correct behavior
        expect(formatDateDisplay('2024-01-01T00:00:00.000Z')).toBe('01/01/2024');
    });

    it('handles null values', () => {
        expect(formatDateDisplay(null)).toBe('-');
    });

    it('handles undefined values', () => {
        expect(formatDateDisplay(undefined)).toBe('-');
    });
});
