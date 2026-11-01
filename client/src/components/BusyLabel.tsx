import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// A button's label, which a spinner replaces while the button is busy. The label (with
// its icon) and the spinner share one grid cell, and the label turns transparent rather
// than leaving, so the button keeps its idle width and the label stays its accessible
// name. The spinner is always there, unseen until busy, so a label narrower than it
// can't change the width either. The busy text is for screen readers only: each button
// reads it out from a polite live region beside it, since text inside the button would
// join its name. An icon-only button passes no label and is named by its aria-label.
export default function BusyLabel({ label = '', busy, icon, gap = 'gap-2' }: {
  label?: string
  busy: boolean
  icon?: ReactNode
  gap?: 'gap-1' | 'gap-1.5' | 'gap-2' // between the icon and the label
}) {
  return (
    <span className="grid place-items-center">
      <span className={`col-start-1 row-start-1${icon ? ` flex items-center ${gap}` : ''}${busy ? ' opacity-0' : ''}`}>
        {icon}
        {label}
      </span>
      <Loader2 aria-hidden className={`col-start-1 row-start-1 w-4 h-4 ${busy ? 'animate-spin' : 'invisible'}`} />
    </span>
  )
}
