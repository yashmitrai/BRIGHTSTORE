import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'accent' | 'white';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'accent' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    brand: 'border-slate-900/10 border-t-slate-900',
    accent: 'border-blue-500/10 border-t-blue-600',
    white: 'border-white/25 border-t-white',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} border-solid`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
