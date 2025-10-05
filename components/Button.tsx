import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, className = '', ...props }) => {
  const baseClasses = 'w-full py-3 px-4 rounded-xl font-semibold text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-pan-black disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-gray-800 text-white dark:bg-pan-gray-dark dark:text-pan-white hover:bg-opacity-90 dark:hover:bg-opacity-80 focus:ring-gray-800 dark:focus:ring-pan-white',
    secondary: 'bg-gray-200 text-gray-800 dark:bg-pan-gray dark:text-pan-black hover:bg-gray-300 dark:hover:bg-pan-gray-light focus:ring-gray-400 dark:focus:ring-pan-gray',
    outline: 'bg-transparent border-2 border-gray-300 dark:border-pan-gray text-gray-800 dark:text-pan-white hover:bg-gray-100 dark:hover:bg-pan-gray-dark focus:ring-gray-400 dark:focus:ring-pan-gray',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex justify-center items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;