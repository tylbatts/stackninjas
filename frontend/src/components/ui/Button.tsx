import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'secondary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    let baseClasses =
      'inline-flex items-center justify-center px-4 py-2 font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2';
    let variantClasses = '';
    if (variant === 'default') {
      variantClasses =
        'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
    } else if (variant === 'secondary') {
      variantClasses =
        'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500';
    } else if (variant === 'ghost') {
      variantClasses =
        'bg-transparent text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500';
    }
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';