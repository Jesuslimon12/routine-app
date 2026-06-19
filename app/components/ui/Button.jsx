const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-colors duration-150 ease-out cursor-pointer ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none ' +
  'select-none'

const VARIANTS = {
  primary:
    'bg-brand-500 text-text-on-brand shadow-sm ' +
    'hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-brand-500',

  secondary:
    'border border-border-default bg-surface-card text-text-primary ' +
    'hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-brand-500',

  ghost:
    'bg-transparent text-text-secondary hover:bg-neutral-100 hover:text-text-primary ' +
    'active:bg-neutral-200 focus-visible:outline-brand-500',

  destructive:
    'bg-error text-white shadow-sm hover:opacity-90 active:opacity-80 ' +
    'focus-visible:outline-error',
}

const SIZES = {
  sm: 'min-h-11 px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[52px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  children,
  ...props
}) {
  const classes = [
    BASE,
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  )
}

export default Button
