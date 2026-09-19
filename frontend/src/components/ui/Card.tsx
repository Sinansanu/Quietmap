import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'dark' | 'sand';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-surface-card border border-sage-200 shadow-sm text-sage-800',
    accent: 'bg-surface-accent border border-forest-200 shadow-sm text-forest-900',
    dark: 'bg-surface-dark border border-forest-800 shadow-sm text-white',
    sand: 'bg-coral-50 border border-coral-200 shadow-sm text-coral-600',
  }[variant];

  return (
    <div className={`rounded-xl p-6 transition-all duration-200 ${variantStyles} ${className}`}>
      {children}
    </div>
  );
};
