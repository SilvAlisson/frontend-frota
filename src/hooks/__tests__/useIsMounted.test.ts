import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useIsMounted } from '../useIsMounted';

describe('useIsMounted', () => {
  it('should return true after mount', () => {
    const { result } = renderHook(() => useIsMounted());
    
    // GREEN: should be true after mount
    expect(result.current).toBe(true);
  });
});
