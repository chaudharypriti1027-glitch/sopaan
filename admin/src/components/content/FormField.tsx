import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-label">{label}</span>
      {children}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}
