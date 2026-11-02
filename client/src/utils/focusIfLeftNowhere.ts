// A success view that replaces a form takes focus as it mounts, used as a callback ref on
// its heading: the form left with focus in it, so focus fell to the page. Someone who
// moved on while the request was out keeps their place. React attaches refs after it has
// removed the form, so by then focus is on the page or wherever they moved it.
export function focusIfLeftNowhere(heading: HTMLElement | null): void {
  const active = document.activeElement
  if (heading && (!active || active === document.body)) heading.focus()
}
