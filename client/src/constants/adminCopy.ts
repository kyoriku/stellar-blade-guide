// The admin page's copy, its dialogs' and the account menu's link, gathered here so
// the wording is one file. Imports nothing: the e2e spec loads this module under
// Playwright, which has no import.meta.env (services/api.ts reads it at the top).
// Counts arrive already formatted with toLocaleString().

export const ADMIN_COPY = {
  // The account menu and drawer link; the tab title ("Admin") is seo.json's.
  navLink: 'Admin',
  pageHeading: 'Admin Dashboard',
  usersHeading: 'Users',
  description:
    "Every account, newest first. Emails stay masked until you reveal one, and each reveal is logged. Admin accounts, yours included, can't be changed here.",

  // The search box's label, read by screen readers only, and its placeholder, shorter
  // so it shows whole at every width (the label's words were cut at 320px).
  searchLabel: 'Search by username or full email',
  searchPlaceholder: 'Username or full email',
  clearSearch: 'Clear search',

  // The status line above the list.
  loading: 'Loading accounts…',
  searching: 'Searching…',
  accounts: (n: number, formatted: string) => `${formatted} account${n === 1 ? '' : 's'}`,
  accountsMatch: (n: number, formatted: string) =>
    n === 1 ? `${formatted} account matches` : `${formatted} accounts match`,
  noMatches: 'No accounts match that search.',

  // The list's column headers. Actions has no visible text; screen readers read it.
  columnAccount: 'Account',
  columnStatus: 'Status',
  columnJoined: 'Joined',
  columnActions: 'Actions',

  you: '(you)',
  roleModerator: 'moderator',
  roleAdmin: 'admin',
  statusActive: 'active',
  statusDeactivated: 'deactivated',
  // Below lg the date reads "Joined Oct 31, 2026", since no header shows.
  joined: 'Joined',
  noActions: 'No actions',

  revealing: 'Revealing…',
  revealFor: (username: string) => `Reveal email for ${username}`,
  hideFor: (username: string) => `Hide email for ${username}`,

  // The row's "…" button and the menu it opens share this name.
  actionsFor: (username: string) => `Actions for ${username}`,
  makeModerator: 'Make moderator',
  removeModerator: 'Remove moderator',
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  delete: 'Delete',
  // Read out while a role change or a reactivation runs, then the result.
  saving: 'Saving…',
  nowModerator: (username: string) => `${username} is now a moderator.`,
  noLongerModerator: (username: string) => `${username} is no longer a moderator.`,
  isDeactivated: (username: string) => `${username} is deactivated.`,
  activeAgain: (username: string) => `${username} is active again.`,

  deleteTitle: 'Delete account',
  deleteBody: (username: string) =>
    `The account ${username} will be permanently deleted with its progress and notifications, and the text of its comments will be erased. This cannot be undone.`,
  // The typed confirmation's label. The dialog sets the username in monospace, so
  // it also needs the words around it.
  deleteConfirmLabel: (username: string) => `Type ${username} to confirm`,
  deleteConfirmAround: ['Type ', ' to confirm'] as const,
  deleting: 'Deleting…',
  deleted: (username: string) => `The account ${username} was deleted.`,

  deactivateTitle: 'Deactivate account',
  deactivateBody: (username: string) =>
    `${username} will be signed out everywhere and can't sign in until you reactivate the account.`,
  deactivating: 'Deactivating…',

  // Settings' Danger Zone, for an admin account.
  settingsRefusal: "Admin accounts can't be deleted.",

  loadError: "Couldn't load accounts. Please try again.",
  tryAgain: 'Try again',
  revealError: "Couldn't reveal the email. Please try again.",
  roleError: "Couldn't change the role. Please try again.",
  statusError: "Couldn't change the account's status. Please try again.",
  deleteError: "Couldn't delete the account. Please try again.",
  gone: 'That account no longer exists.',
  timeout: 'That took too long. Please try again.',
} as const
