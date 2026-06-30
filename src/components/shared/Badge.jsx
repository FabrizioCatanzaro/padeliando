const COLOR_CHIP = {
  default: 'text-muted border-border-mid bg-surface',
  brand:   'text-brand  border-brand/30  bg-surface',
  cyan:    'text-cyan   border-cyan/30   bg-surface',
  green:   'text-green  border-green/30  bg-surface',
  danger:  'text-danger border-danger/30 bg-surface',
}

const COLOR_LABEL = {
  default: 'text-muted  border-border-strong',
  brand:   'text-brand  border-brand/40',
  cyan:    'text-cyan   border-cyan/40',
  green:   'text-green  border-green/40',
  danger:  'text-danger border-danger/40',
}

const COLOR_STATUS = {
  default: 'text-muted',
  brand:   'text-brand',
  cyan:    'text-cyan',
  green:   'text-green',
  danger:  'text-danger',
}

const STATUS_DOT = { default: '■', brand: '●', cyan: '●', green: '●', danger: '●' }

export default function Badge({
  variant = 'chip',
  color   = 'default',
  icon: Icon,
  children,
  className = '',
}) {
  if (variant === 'status') {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-mono ${COLOR_STATUS[color]} ${className}`}>
        <span>{STATUS_DOT[color]}</span>
        {children}
      </span>
    )
  }

  if (variant === 'label') {
    return (
      <span className={`inline-flex items-center gap-1 border rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-bold ${COLOR_LABEL[color]} ${className}`}>
        {Icon && <Icon size={9} />}
        {children}
      </span>
    )
  }

  // chip (default)
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-mono ${COLOR_CHIP[color]} ${className}`}>
      {Icon && <Icon size={10} />}
      {children}
    </span>
  )
}
