import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'neutral' | 'accent';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  icon,
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-coral-50 text-coral-600 border-coral-200',
    neutral: 'bg-sage-100 text-sage-700 border-sage-200',
    accent: 'bg-forest-50 text-forest-700 border-forest-200',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
