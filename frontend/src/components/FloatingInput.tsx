import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FloatingInputProps = {
  label: string;
  textarea?: boolean;
  rows?: number;
} & (InputHTMLAttributes<HTMLInputElement> | TextareaHTMLAttributes<HTMLTextAreaElement>);

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  textarea,
  rows = 3,
  id,
  ...props
}) => {
  const inputId = id || `floating-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const commonClasses =
    'peer block w-full appearance-none bg-transparent border-0 border-b-2 border-neutral-300 px-0 pb-2.5 pt-4 text-sm text-neutral-900 focus:outline-none focus:ring-0 focus:border-primary-600 placeholder-transparent';
  return (
    <div className="relative mb-6">
      {textarea ? (
        <textarea
          id={inputId}
          rows={rows}
          placeholder=" "
          className={`${commonClasses} resize-none`}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          type={(props as InputHTMLAttributes<HTMLInputElement>).type || 'text'}
          placeholder=" "
          className={commonClasses}
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      <label
        htmlFor={inputId}
        className="absolute text-sm text-neutral-500 duration-300 transform -translate-y-4 scale-75 top-2 left-0 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-primary-600"
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;