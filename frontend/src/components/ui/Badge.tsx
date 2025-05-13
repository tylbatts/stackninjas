import React from 'react';

interface BadgeProps {
  variant?: 'Open' | 'In Progress' | 'Closed';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'Open', children }) => {
  let colorClasses = 'bg-red-100 text-red-800';
  if (variant === 'Closed') colorClasses = 'bg-green-100 text-green-800';
  if (variant === 'In Progress') colorClasses = 'bg-yellow-100 text-yellow-800';
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}
    >
      {children || variant}
    </span>
  );
};