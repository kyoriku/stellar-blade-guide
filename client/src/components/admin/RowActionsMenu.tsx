import { Fragment } from 'react'
import { Ellipsis, ShieldMinus, ShieldPlus, Trash2, UserCheck, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BusyLabel from '../BusyLabel'
import { useMenuButton } from '../../hooks/useMenuButton'
import { ADMIN_COPY } from '../../constants/adminCopy'
import type { RowAction } from '../../utils/adminUsers'

const ITEMS: Record<RowAction, { label: string; Icon: LucideIcon }> = {
  promote: { label: ADMIN_COPY.makeModerator, Icon: ShieldPlus },
  demote: { label: ADMIN_COPY.removeModerator, Icon: ShieldMinus },
  deactivate: { label: ADMIN_COPY.deactivate, Icon: UserX },
  reactivate: { label: ADMIN_COPY.reactivate, Icon: UserCheck },
  delete: { label: ADMIN_COPY.delete, Icon: Trash2 },
}

// The account menu's item look (accountItemClass in Navbar.tsx), hover and keyboard
// focus alike, since the arrows move focus here; in forced colors the outline sits
// inside the item, where the panel's overflow-hidden can't clip it. The two are kept
// in step by hand.
const ITEM_CLASS = 'w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left border-l-2 border-transparent transition-[color,background-color] duration-200 cursor-pointer focus-visible:outline-hidden forced-colors:focus-visible:-outline-offset-4'
const PLAIN_ITEM = `${ITEM_CLASS} text-gray-300 hover:text-white hover:bg-gray-800/50 hover:border-gray-400 focus-visible:text-white focus-visible:bg-gray-800/50 focus-visible:border-gray-400`
const DANGER_ITEM = `${ITEM_CLASS} text-red-400 hover:bg-red-500/10 hover:border-red-400 focus-visible:bg-red-500/10 focus-visible:border-red-400`

// A row's "…" button and its menu: the role change, the status change, then Delete.
// From lg the button is a 36px bordered box. Below it, the bare icon in a 40px tap
// area: the negative margins centre it on the 20px name line and put the icon's
// right edge on the card's content edge, and it takes no more room than the icon.
export default function RowActionsMenu({ userId, username, actions, busy, onAction }: {
  userId: number
  username: string
  actions: RowAction[]
  // An action of this row's is running: the button shows a spinner and ignores presses.
  busy: boolean
  onAction: (action: RowAction) => void
}) {
  const { open, rootProps, triggerProps, panelProps, menuProps, getItemProps } = useMenuButton({ disabled: busy })
  const name = ADMIN_COPY.actionsFor(username)

  return (
    <div {...rootProps} className="relative">
      <button
        type="button"
        {...triggerProps}
        // AdminPage finds the button by this to give focus back after a dialog.
        data-admin-actions={userId}
        aria-label={name}
        // Busy rather than disabled, so it keeps focus and does not dim.
        aria-busy={busy}
        className="flex items-center justify-center w-10 h-10 -my-2.5 -mr-3 rounded-lg text-gray-300 hover:text-cyan-400 aria-expanded:text-cyan-400 transition-colors duration-200 cursor-pointer aria-busy:cursor-progress lg:w-9 lg:h-9 lg:m-0 lg:border lg:border-gray-700 lg:hover:bg-gray-800/50 lg:aria-expanded:bg-gray-800/50"
      >
        <BusyLabel busy={busy} icon={<Ellipsis className="w-4 h-4" />} />
      </button>

      {open && (
        // The account menu's panel. The username names the row the menu acts on; it
        // sits outside the menu, which holds only the items.
        <div {...panelProps} className="absolute right-0 top-full mt-3 lg:mt-2 z-20 w-56 bg-nav rounded-xl shadow-2xl border border-gray-700 overflow-hidden animate-drop-in">
          <div className="px-4 py-3 border-b border-gray-700/50">
            <p className="text-sm font-medium text-white truncate">{username}</p>
          </div>
          <div {...menuProps} aria-label={name} className="py-1.5">
            {actions.map(action => {
              const { label, Icon } = ITEMS[action]
              return (
                <Fragment key={action}>
                  {action === 'delete' && <div role="separator" className="my-1.5 border-t border-gray-700/50" />}
                  <button
                    type="button"
                    {...getItemProps(() => onAction(action))}
                    className={action === 'delete' ? DANGER_ITEM : PLAIN_ITEM}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                </Fragment>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
