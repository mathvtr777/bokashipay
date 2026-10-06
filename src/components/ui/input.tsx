'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  /** Ícone opcional à esquerda (ReactNode). */
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, suffix, id, ...props }, ref) => {
    const fieldId = id ?? React.useId()

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 [&>svg]:h-4 [&>svg]:w-4">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 transition-all duration-200 ease-premium',
              'placeholder:text-ink-400',
              'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12',
              'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
              'dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500',
              'dark:disabled:bg-ink-800',
              icon && 'pl-10',
              suffix && 'pr-11',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/12 dark:border-red-500/70'
                : 'border-ink-200 dark:border-ink-700',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{suffix}</span>
          )}
        </div>
        {error ? (
          <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'

// -----------------------------------------------------------------------------
// Select
// -----------------------------------------------------------------------------

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, id, ...props }, ref) => {
    const fieldId = id ?? React.useId()

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-white bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3.5 pr-10 text-sm transition-all duration-200',
            'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12',
            'dark:bg-ink-900 dark:text-ink-50',
            error ? 'border-red-400 dark:border-red-500/70' : 'border-ink-200 dark:border-ink-700',
            className,
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%238592ab' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
          }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Select.displayName = 'Select'

// -----------------------------------------------------------------------------
// Textarea
// -----------------------------------------------------------------------------

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const fieldId = id ?? React.useId()
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm transition-all duration-200',
            'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12',
            'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500',
            error ? 'border-red-400 dark:border-red-500/70' : '',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

// -----------------------------------------------------------------------------
// Checkbox
// -----------------------------------------------------------------------------

export function Checkbox({
  label,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  const fieldId = id ?? React.useId()
  return (
    <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-2.5 select-none">
      <input
        id={fieldId}
        type="checkbox"
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-300 text-brand-600 transition-colors',
          'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0 dark:border-ink-600 dark:bg-ink-800',
          className,
        )}
        {...props}
      />
      <span className="text-sm text-ink-600 dark:text-ink-300">{label}</span>
    </label>
  )
}