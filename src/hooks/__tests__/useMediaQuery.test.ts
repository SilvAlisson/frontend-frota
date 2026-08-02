import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { useMediaQuery, useIsMobile } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let mockMatchMedia: any;

  beforeAll(() => {
    mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(max-width: 768px)', // Hardcode to simulate mobile
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    
    // Polyfill for JSDOM
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  it('returns true if media query matches', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    // GREEN: it should be true
    expect(result.current).toBe(true);
  });

  it('returns false if media query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    // GREEN: it should be false
    expect(result.current).toBe(false);
  });
});

describe('useIsMobile', () => {
  it('returns true when in mobile viewport', () => {
    const { result } = renderHook(() => useIsMobile());
    // GREEN: should be true
    expect(result.current).toBe(true);
  });
});
