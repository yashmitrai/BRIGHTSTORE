import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClasses = 'animate-pulse bg-slate-200/80 dark:bg-slate-800/80';
  
  const variantClasses = {
    text: 'h-3.5 w-full rounded',
    rect: 'h-24 w-full rounded-xl',
    circle: 'w-10 h-10 rounded-full',
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
};

export default Skeleton;
