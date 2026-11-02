import { memo } from 'react'
import { Eye, EyeOff, User } from 'lucide-react'
import BusyLabel from '../BusyLabel'
import AdminEmail from './AdminEmail'
import RowActionsMenu from './RowActionsMenu'
import { ADMIN_COPY } from '../../constants/adminCopy'
import { canChange, joinedDate, joinedDateTime, rolePill, rowActions } from '../../utils/adminUsers'
import type { RowAction } from '../../utils/adminUsers'
import type { AdminUser } from '../../hooks/useAdminUsers'

// A 20px box: 16px of text, a pixel of padding and of border above and below.
const PILL = 'inline-block text-xs leading-4 px-1.5 py-px rounded border'
// The comment badges' cyan, a pixel slimmer so the pill fits the 20px name line.
const ROLE_PILL = `${PILL} bg-cyan-400/10 text-cyan-400 border-cyan-400/20`
// Below lg it sits in the 16px status line: the negative margins keep that line 16px,
// as the mock's inline pill does, and its box spills two pixels above and below,
// which the line lets through, since it clips only sideways.
const DEACTIVATED_PILL = `${PILL} max-lg:-my-0.5 bg-yellow-500/10 text-yellow-400 border-yellow-500/25`

interface Props {
  user: AdminUser
  self: boolean // the signed-in admin's own row
  email: string | undefined // the revealed address, if revealed
  revealing: boolean
  busy: boolean // an action on this account is running
  onReveal: (id: number) => void
  onHide: (id: number) => void
  onAction: (action: RowAction, user: AdminUser) => void
}

// One account in the list. Its cells come in the header's order (Account, Status,
// Joined, Actions) in one DOM for both layouts. From lg the row is a subgrid of the
// list's four columns. Below lg it stacks: the account at the top left, the "…" at
// the top right, and under them one line of status and date, where an active row's
// status is read out but not shown.
function AdminUserRow({ user, self, email, revealing, busy, onReveal, onHide, onAction }: Props) {
  const changeable = canChange(user)
  const revealed = email !== undefined
  const name = user.username
  const pill = rolePill(user.role)

  return (
    <div
      role="row"
      data-admin-row={user.id}
      className="grid border-t border-gray-800 py-3.5 max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:gap-x-2 max-lg:gap-y-1.5 lg:col-span-full lg:grid-cols-subgrid lg:items-center lg:py-4"
    >
      <div role="cell" className="min-w-0 max-lg:col-start-1 max-lg:row-start-1">
        <div className="flex items-start gap-3 min-w-0">
          {/* The navbar's avatar. Empty alt: the name is right beside it. */}
          <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center overflow-hidden shrink-0">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" />
              : <User className="w-4 h-4 text-cyan-400" />}
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 text-sm font-medium text-gray-100 wrap-anywhere">{name}</span>
              {self && <span className="text-xs text-gray-400">{ADMIN_COPY.you}</span>}
              {pill && <span className={ROLE_PILL}>{pill === 'admin' ? ADMIN_COPY.roleAdmin : ADMIN_COPY.roleModerator}</span>}
            </div>
            {/* The eye alone comes first, at every width: its 28px tap area takes no
                more room than the icon and stops short of the address, which wraps in
                its own box beside it. While the address loads, a spinner takes the
                eye's place. */}
            <div className="flex items-start gap-2 text-xs">
              {changeable && (
                <button
                  type="button"
                  onClick={() => {
                    if (revealing) return
                    if (revealed) onHide(user.id)
                    else onReveal(user.id)
                  }}
                  aria-label={revealed ? ADMIN_COPY.hideFor(name) : ADMIN_COPY.revealFor(name)}
                  aria-busy={revealing}
                  className="flex shrink-0 items-center p-1.5 -m-1.5 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer aria-busy:cursor-progress"
                >
                  <BusyLabel busy={revealing} icon={revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} />
                </button>
              )}
              <AdminEmail address={email ?? user.email_masked} revealed={revealed} />
            </div>
          </div>
        </div>
      </div>

      {/* Status and Joined. From lg both wrappers are display: contents, so the two
          cells take the list's second and third columns. Below lg they share the line
          under the account, indented past the avatar. Each cell keeps a 20px slot on
          its left and the line is pulled 20px left inside a box that clips sideways,
          so the dot in the date's slot shows only after the pill, 8px either side as
          in the mock, and never starts a wrapped line. */}
      <div role="none" className="max-lg:col-span-full max-lg:row-start-2 max-lg:ml-11 max-lg:overflow-x-clip lg:contents">
        <div role="none" className="max-lg:-ml-5 max-lg:flex max-lg:flex-wrap max-lg:items-center max-lg:gap-y-1 max-lg:text-xs max-lg:text-gray-400 lg:contents">
          <div role="cell" className={user.is_active ? 'max-lg:sr-only lg:text-sm lg:text-gray-400' : 'max-lg:pl-5'}>
            {user.is_active
              ? ADMIN_COPY.statusActive
              : <span className={DEACTIVATED_PILL}>{ADMIN_COPY.statusDeactivated}</span>}
          </div>
          <div role="cell" className="relative whitespace-nowrap max-lg:pl-5 lg:text-sm lg:text-gray-400">
            <span aria-hidden className="absolute left-0 w-5 text-center lg:hidden">·</span>
            <span className="lg:hidden">{`${ADMIN_COPY.joined} `}</span>
            <time dateTime={joinedDateTime(user.created_at)}>{joinedDate(user.created_at)}</time>
          </div>
        </div>
      </div>

      <div role="cell" className="flex justify-end max-lg:col-start-2 max-lg:row-start-1 max-lg:self-start">
        {changeable ? (
          <RowActionsMenu
            userId={user.id}
            username={name}
            actions={rowActions(user)}
            busy={busy}
            onAction={action => onAction(action, user)}
          />
        ) : (
          <span className="text-xs text-gray-400 max-lg:block max-lg:leading-5">{ADMIN_COPY.noActions}</span>
        )}
      </div>
    </div>
  )
}

export default memo(AdminUserRow)
