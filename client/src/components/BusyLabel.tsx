import { Loader2 } from 'lucide-react'

// A button label that a spinner and a short busy text can replace without the
// button changing size: every variant shares one grid cell, so the button is as
// wide as the widest of them, and only the active one shows. The label fades
// rather than hides, so it stays the button's accessible name.
export default function BusyLabel({ label, busy, variants }: {
  label: string
  busy: string | null // the variant showing now, or null for the label
  variants: readonly string[]
}) {
  return (
    <span className="grid place-items-center">
      <span className={`col-start-1 row-start-1${busy ? ' opacity-0' : ''}`}>{label}</span>
      {variants.map(text => (
        <span
          key={text}
          aria-hidden
          className={`col-start-1 row-start-1 flex items-center gap-2${busy === text ? '' : ' invisible'}`}
        >
          <Loader2 className={`w-4 h-4${busy === text ? ' animate-spin' : ''}`} />
          {text}
        </span>
      ))}
    </span>
  )
}
