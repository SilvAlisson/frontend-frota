import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    
    // GREEN: should be in the document
    expect(screen.queryByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    // GREEN: should be called
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    
    // GREEN: should be disabled
    expect(button).toBeDisabled();
  });

  it('shows loader and disables button when isLoading is true', () => {
    render(<Button isLoading data-testid="loading-btn">Submit</Button>);
    const button = screen.getByTestId('loading-btn');
    
    // GREEN: should be disabled and have svg
    expect(button).toBeDisabled();
    
    // Note: lucide-react Loader2 is an SVG.
    const svg = button.querySelector('svg');
    // GREEN: should have svg
    expect(svg).toBeInTheDocument();
  });

  it('triggers haptic feedback on pointer down if available', () => {
    // Mock navigator.vibrate
    const vibrateMock = vi.fn();
    Object.defineProperty(global.navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true
    });

    render(<Button>Vibrate</Button>);
    
    fireEvent.pointerDown(screen.getByText('Vibrate'));
    
    // GREEN: should be called with 10ms
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });
});
