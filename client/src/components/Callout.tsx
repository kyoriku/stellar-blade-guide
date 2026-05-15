interface Props {
  children: React.ReactNode
  variant?: 'info' | 'warning' | 'danger'
}

const variants = {
  info: 'border-cyan-400 bg-cyan-400/5',
  warning: 'border-amber-400 bg-amber-400/5',
  danger: 'border-red-400 bg-red-400/5',
}

export default function Callout({ children, variant = 'info' }: Props) {
  return (
    <div className={`border-l-4  ${variants[variant]} px-4 py-3 rounded-r my-4 text-gray-200 `}>
      {children}
    </div>
  )
}