import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react'

// The WAI-ARIA menu button pattern, for any menu: the admin page's row menus today,
// and the navbar's account menu next (its items are links). The consumer renders the
// elements and spreads the props:
//
//   <div {...rootProps}>                         the trigger and the panel, together
//     <button type="button" {...triggerProps} aria-label="…">…</button>
//     <div {...panelProps}>                      the whole panel, a header included
//       <div {...menuProps} aria-label="…">      role="menu", where focus moves
//         <button {...getItemProps(onSelect)}>…</button>
//         <Link to="/x" {...getItemProps()}>…</Link>
//
// The trigger opens the menu on its first item (Enter, Space or a click, which the
// browser fires for both keys) or, with the arrows, on the first (Down) or last
// (Up). In the menu the arrows move with wrap-around and Home and End jump to the
// ends. Escape closes and gives focus back to the trigger; Tab closes and lets focus
// move on; a press outside closes; choosing an item closes, focuses the trigger and
// then runs the item's action, so an action that moves focus (a dialog) wins.
//
// The menu may unmount while closed, or stay mounted and hide: items are found in
// the DOM when needed, so links, conditional items and separators all just work.

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'

type FocusTarget = 'first' | 'last'

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : []
}

// Whether the item took focus: a menu fading in with a visibility transition is
// still hidden in the frame it opens, and a hidden item can't take it.
function focusItem(menu: HTMLElement | null, target: FocusTarget | number): boolean {
  const items = menuItems(menu)
  const index = target === 'first' ? 0 : target === 'last' ? items.length - 1 : target
  const item = items.at(index)
  if (!item) return false
  item.focus()
  return document.activeElement === item
}

export interface MenuButtonOptions {
  // While true the trigger doesn't open the menu, and an open menu closes: a row
  // whose last action is still saving, say.
  disabled?: boolean
}

export function useMenuButton({ disabled = false }: MenuButtonOptions = {}) {
  const [open, setOpen] = useState(false)
  // Adjusted during render rather than in an effect, so a disabled menu never paints open.
  if (disabled && open) setOpen(false)
  const menuId = useId()
  const rootRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLElement | null>(null)
  // Which item takes focus once the menu has rendered open.
  const pendingFocus = useRef<FocusTarget | null>(null)
  // Set by a Tab in the menu, so the focus change it causes closes the menu even when
  // it lands on the trigger (Shift+Tab).
  const tabbing = useRef(false)

  // Callback refs, so any element type can take them.
  const setRoot = useCallback((el: HTMLElement | null) => { rootRef.current = el }, [])
  const setTrigger = useCallback((el: HTMLElement | null) => { triggerRef.current = el }, [])
  const setMenu = useCallback((el: HTMLElement | null) => { menuRef.current = el }, [])

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    pendingFocus.current = null
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  const openOn = (target: FocusTarget) => {
    pendingFocus.current = target
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open) return
    const target = pendingFocus.current
    pendingFocus.current = null
    if (!target || focusItem(menuRef.current, target)) return
    // The next frame, once a fade-in has made the items visible.
    const frame = requestAnimationFrame(() => { focusItem(menuRef.current, target) })
    return () => cancelAnimationFrame(frame)
  }, [open])

  // A press anywhere outside closes the menu without taking focus anywhere: it goes
  // where the press puts it. Capture, so nothing on the page can stop it first.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const node = e.target instanceof Node ? e.target : null
      if (node && [rootRef, triggerRef, menuRef].some(ref => ref.current?.contains(node))) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  const onRootBlur = (e: FocusEvent<HTMLElement>) => {
    if (!open) return
    const next = e.relatedTarget instanceof Node ? e.relatedTarget : null
    // Between items, or from the trigger into the menu.
    if (next && menuRef.current?.contains(next)) return
    if (tabbing.current) {
      tabbing.current = false
      setOpen(false)
      return
    }
    // A press on the trigger moves focus to it in most browsers; its click decides.
    if (next && (rootRef.current?.contains(next) || triggerRef.current?.contains(next))) return
    // Focus moved on to something else. With nowhere to go (the window lost focus, or a
    // press landed on nothing focusable), the outside-press handler decides instead.
    if (next) setOpen(false)
  }

  const onTriggerClick = () => {
    if (open) close(true)
    else if (!disabled) openOn('first')
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (disabled) return
      const target: FocusTarget = e.key === 'ArrowDown' ? 'first' : 'last'
      if (open) focusItem(menuRef.current, target)
      else openOn(target)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      close()
    }
  }

  const onMenuKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    tabbing.current = e.key === 'Tab'
    const items = menuItems(menuRef.current)
    if (items.length === 0) return
    const current = items.indexOf(document.activeElement as HTMLElement)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItem(menuRef.current, (current + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem(menuRef.current, current <= 0 ? items.length - 1 : current - 1)
        break
      case 'Home':
        e.preventDefault()
        focusItem(menuRef.current, 'first')
        break
      case 'End':
        e.preventDefault()
        focusItem(menuRef.current, 'last')
        break
      case 'Escape':
        e.preventDefault()
        close(true)
        break
      case ' ':
      case 'Enter': {
        // A button activates itself on both keys and a link on Enter; this covers a
        // link's Space and any other element given the role.
        const item = e.target instanceof Element ? e.target.closest<HTMLElement>(ITEM_SELECTOR) : null
        if (!item || item instanceof HTMLButtonElement) return
        if (e.key === 'Enter' && item instanceof HTMLAnchorElement && item.href) return
        e.preventDefault()
        item.click()
        break
      }
    }
  }

  return {
    open,
    // Closes from outside the menu (a route change, say); true gives focus back to the trigger.
    close,
    triggerRef,
    rootProps: { ref: setRoot, onBlur: onRootBlur },
    triggerProps: {
      ref: setTrigger,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': open,
      // Only while the menu exists: a closed one may not be in the DOM.
      'aria-controls': open ? menuId : undefined,
      onClick: onTriggerClick,
      onKeyDown: onTriggerKeyDown,
    },
    menuProps: { ref: setMenu, id: menuId, role: 'menu' as const, onKeyDown: onMenuKeyDown },
    // A press in the panel keeps focus where it is. On a header, the menu's padding
    // or a separator it would otherwise land on <body>, leaving the menu open with
    // no keys working. A press on an item still clicks it, and middle and Ctrl
    // clicks on a link still open it in a new tab. The cost: no text in the panel
    // can be selected with the mouse, a header's included.
    panelProps: { onMouseDown: (e: MouseEvent<HTMLElement>) => e.preventDefault() },
    getItemProps: (onSelect?: (e: MouseEvent<HTMLElement>) => void) => ({
      role: 'menuitem' as const,
      // Out of the tab order: the arrows move between items.
      tabIndex: -1,
      onClick: (e: MouseEvent<HTMLElement>) => {
        close(true)
        onSelect?.(e)
      },
    }),
  }
}
