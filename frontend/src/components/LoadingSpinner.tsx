import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-forest-700 mb-2`} />
      {message && <p className="text-xs font-medium text-slate-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
