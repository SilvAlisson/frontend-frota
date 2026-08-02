import { renderHook } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useScrollLock } from '../useScrollLock';

describe('useScrollLock', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('locks scroll on desktop when open', () => {
    renderHook(() => useScrollLock(true, true));
    
    // GREEN: locks scroll on desktop
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('does not lock scroll when closed', () => {
    renderHook(() => useScrollLock(false, true));
    
    // GREEN: does not lock scroll
    expect(document.body.style.overflow).toBe('');
  });

  it('does not apply desktop overflow hidden on mobile', () => {
    renderHook(() => useScrollLock(true, false));
    
    // GREEN: does not apply hidden on mobile
    expect(document.body.style.overflow).toBe('');
  });
});
