import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<Input placeholder="Type here" />);
    
    // GREEN: should be in the document
    expect(screen.queryByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('renders a label if provided', () => {
    render(<Input label="Username" id="username" />);
    
    // GREEN: should be in the document
    expect(screen.queryByText('Username')).toBeInTheDocument();
  });

  it('renders an error message and sets aria-invalid', () => {
    render(<Input error="This field is required" data-testid="input" />);
    
    const input = screen.getByTestId('input');
    
    // GREEN: should be in the document and have aria-invalid true
    expect(screen.queryByText('This field is required')).toBeInTheDocument();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('calls scrollIntoView on focus', () => {
    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(<Input data-testid="input" />);
    
    const input = screen.getByTestId('input');
    fireEvent.focus(input);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // GREEN: should have been called
    expect(scrollIntoViewMock).toHaveBeenCalledOnce();
  });

  it('calls onFocus prop if provided', () => {
    const onFocusMock = vi.fn();
    render(<Input data-testid="input" onFocus={onFocusMock} />);
    
    const input = screen.getByTestId('input');
    fireEvent.focus(input);

    // GREEN: should have been called
    expect(onFocusMock).toHaveBeenCalledOnce();
  });
});
