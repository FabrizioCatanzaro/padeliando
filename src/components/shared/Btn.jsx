import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-brand text-base border-0 font-condensed font-bold tracking-widest hover:opacity-90 disabled:opacity-40',
  secondary: 'bg-transparent text-content border border-border-strong font-sans hover:bg-border-mid hover:text-white disabled:opacity-40',
  danger:    'bg-transparent text-danger border border-danger/40 font-sans hover:bg-danger/10 disabled:opacity-40',
  ghost:     'bg-transparent text-muted border-0 font-sans hover:text-white disabled:opacity-40',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-sm',
  md: 'px-4 py-2.5 text-sm rounded-sm',
  lg: 'px-5 py-3 text-base rounded-sm',
}

export default function Btn({
  variant = 'secondary',
  size = 'md',
  full = false,
  loading = false,
  icon: Icon,
  children,
  className = '',
  ...props
}) {
  const iconSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;
  const isDisabled = props.disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        full ? 'w-full' : '',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" />
        : Icon && <Icon size={iconSize} />
      }
      {children}
    </button>
  )
}
