import React from 'react';

// Define as variantes possíveis para o nosso botão
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

// Define as props do botão, estendendo as props nativas do HTML (onClick, disabled, type, etc.)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean; // Adicionamos uma prop para mostrar estado de carregamento facilmente
  icon?: React.ReactNode; // Para ícones à esquerda (opcional)
}

export function Button({ 
  variant = 'primary', 
  isLoading = false, 
  icon,
  children, 
  className = '', 
  disabled,
  ...rest 
}: ButtonProps) {

  // Estilos base (comuns a todos os botões)
  // Nota: 'rounded-button' vem do nosso index.css (--border-radius-button)
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-200 rounded-button focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95";

  // Estilos específicos de cada variante (usando as cores do index.css)
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-surface hover:bg-primary-hover focus:ring-primary",
    secondary: "bg-surface text-text border border-gray-200 hover:bg-gray-50 focus:ring-gray-300",
    ghost: "bg-transparent text-primary hover:bg-primary-soft shadow-none hover:shadow-none",
    danger: "bg-error text-surface hover:bg-red-700 focus:ring-error",
    success: "bg-success text-surface hover:bg-green-700 focus:ring-success",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {/* Se estiver a carregar, mostra um spinner automático */}
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {/* Se tiver ícone e NÃO estiver a carregar, mostra o ícone */}
      {!isLoading && icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
      
      {children}
    </button>
  );
}