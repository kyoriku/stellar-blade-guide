// True when focus is on nothing, on the page itself, or in `leaving`, something about to
// go (a control, or a whole row with its controls): moving it then costs no one their
// place. Someone who moved on while a request was out keeps it.
export function focusLeftNowhere(leaving?: Element | null): boolean {
  const active = document.activeElement
  return !active || active === document.body || !!leaving?.contains(active)
}

// A callback ref for the heading of a success view that replaces a form: the form left
// with focus in it, so focus fell to the page, and the heading takes it. React attaches
// refs after it has removed the form, so by then focus is on the page or wherever someone
// moved it meanwhile.
export function focusIfLeftNowhere(heading: HTMLElement | null): void {
  if (heading && focusLeftNowhere()) heading.focus()
}
