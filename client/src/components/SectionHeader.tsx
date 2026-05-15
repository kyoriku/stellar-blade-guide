import type { LucideIcon } from 'lucide-react'

interface Props {
  children: React.ReactNode
  icon?: LucideIcon
  id?: string
}

export default function SectionHeader({ children, icon: Icon, id }: Props) {
  return (
    <div className="flex items-center gap-3 mb-2 scroll-mt-20" id={id}>
      {Icon && <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" aria-hidden="true" />}
      <h2 className="text-xl font-semibold text-gray-200 whitespace-nowrap">{children}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-gray-700 to-transparent" />
    </div>
  )
}