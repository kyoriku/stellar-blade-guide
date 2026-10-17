import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// A button label that a spinner and a short busy text can replace without the
// button changing size: every variant shares one grid cell, so the button is as
// wide as the widest of them, and only the active one shows. The label fades
// rather than hides, so it stays the button's accessible name. An icon fades with
// the label, so the spinner takes its place instead of joining it. A borderless
// action in a row of them aligns to the start, so the room kept for the wider
// variant falls after the label rather than around it.
export default function BusyLabel({ label, busy, variants, icon, gap = 'gap-2', align = 'center' }: {
  label: string
  busy: string | null // the variant showing now, or null for the label
  variants: readonly string[]
  icon?: ReactNode
  gap?: 'gap-1' | 'gap-2' // between the icon or spinner and the text
  align?: 'center' | 'start'
}) {
  return (
    <span className={align === 'start' ? 'grid items-center justify-items-start' : 'grid place-items-center'}>
      <span className={`col-start-1 row-start-1${icon ? ` flex items-center ${gap}` : ''}${busy ? ' opacity-0' : ''}`}>
        {icon}
        {label}
      </span>
      {variants.map(text => (
        <span
          key={text}
          aria-hidden
          className={`col-start-1 row-start-1 flex items-center ${gap}${busy === text ? '' : ' invisible'}`}
        >
          <Loader2 className={`w-4 h-4${busy === text ? ' animate-spin' : ''}`} />
          {text}
        </span>
      ))}
    </span>
  )
}
