import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginFormCredentials } from '../LoginFormCredentials';

describe('LoginFormCredentials', () => {
  it('shows validation errors when submitting empty form', async () => {
    const onSubmit = vi.fn();
    const onBiometryClick = vi.fn();

    render(
      <LoginFormCredentials 
        onSubmit={onSubmit} 
        onBiometryClick={onBiometryClick} 
        isSubmittingAuth={false} 
        isAuthenticatingBiometry={false} 
      />
    );

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /acessar/i }));

    // GREEN: should show validation errors (Zod)
    await waitFor(() => {
      expect(screen.queryByText('Email obrigatório')).toBeInTheDocument();
      expect(screen.queryByText('Digite sua senha')).toBeInTheDocument();
    });

    // GREEN: should not submit invalid form
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = vi.fn();
    const onBiometryClick = vi.fn();

    render(
      <LoginFormCredentials 
        onSubmit={onSubmit} 
        onBiometryClick={onBiometryClick} 
        isSubmittingAuth={false} 
        isAuthenticatingBiometry={false} 
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'teste@klin.com' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: '123456' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /acessar/i }));

    // GREEN: should have been called with correct values
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'teste@klin.com',
          password: '123456'
        }),
        expect.anything()
      );
    });
  });

  it('calls onBiometryClick with email when biometry button is clicked', async () => {
    const onSubmit = vi.fn();
    const onBiometryClick = vi.fn();

    render(
      <LoginFormCredentials 
        onSubmit={onSubmit} 
        onBiometryClick={onBiometryClick} 
        isSubmittingAuth={false} 
        isAuthenticatingBiometry={false} 
      />
    );

    // Fill email
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'teste@klin.com' } });

    // Click biometry
    fireEvent.click(screen.getByRole('button', { name: /Login com Biometria/i }));

    // GREEN: should be called with email
    expect(onBiometryClick).toHaveBeenCalledWith('teste@klin.com');
  });
});
