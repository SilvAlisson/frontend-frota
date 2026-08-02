import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEscapeKey } from '../useEscapeKey';

describe('useEscapeKey', () => {
  it('calls onClose when Escape is pressed and isOpen is true', () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(true, onClose));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    // GREEN: should be called
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when Escape is pressed but isOpen is false', () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(false, onClose));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    // GREEN: should not be called
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when another key is pressed', () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(true, onClose));

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(event);

    // GREEN: should not be called
    expect(onClose).not.toHaveBeenCalled();
  });
});
