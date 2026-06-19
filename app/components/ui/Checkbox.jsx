'use client'

import { useId } from 'react'

/**
 * Checkbox — Mi Rutina Diaria
 *
 * Custom-styled checkbox with brand check mark and pop animation.
 *
 * Props:
 *   checked   — boolean
 *   onChange  — (checked: boolean) => void
 *   label     — string
 *   disabled  — boolean (optional)
 */
export function Checkbox({ checked, onChange, label, disabled = false }) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={[
        'flex items-center gap-3 cursor-pointer group',
        'min-h-[44px] py-1',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="sr-only"
        aria-checked={checked}
      />

      <span
        aria-hidden="true"
        className={[
          'flex-shrink-0 flex items-center justify-center',
          'w-5 h-5 rounded-md border-[1.5px] transition-all',
          'duration-[150ms] ease-out',
          checked
            ? 'border-success bg-success'
            : 'border-border-default bg-white group-hover:border-brand-400',
          !disabled ? 'group-hover:shadow-[0_0_0_3px_rgba(109,65,107,0.12)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {checked && (
          <svg
            viewBox="0 0 12 10"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 stroke-white"
            style={{ animation: 'check-pop var(--duration-normal, 250ms) cubic-bezier(0.16, 1, 0.3, 1)' }}
            aria-hidden="true"
          >
            <polyline points="1.5,5 4.5,8.5 10.5,1.5" />
          </svg>
        )}
      </span>

      <span
        className={[
          'text-sm leading-snug transition-colors duration-[150ms]',
          checked ? 'text-text-tertiary line-through' : 'text-text-primary',
        ].join(' ')}
      >
        {label}
      </span>
    </label>
  )
}

export default Checkbox
