import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    
    // GREEN: should be in the document
    expect(screen.queryByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    
    // GREEN: should contain default class
    expect(badge.className).toContain('bg-primary/20');
  });

  it('applies success variant classes when passed', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    const badge = screen.getByTestId('badge');
    
    // GREEN: should contain success class
    expect(badge.className).toContain('bg-success/20');
  });
});
