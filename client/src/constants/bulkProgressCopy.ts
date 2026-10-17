// Placeholder copy for the bulk progress section and its dialog, gathered here so
// the final wording is one file. Imports nothing: the e2e spec loads this module
// under Playwright, which has no import.meta.env (services/api.ts reads it at the
// top). Counts arrive already formatted with toLocaleString().

// What a sentence needs to name the scope: its label, whether it is "everything"
// (which gets its own wording), and the cycle, if narrowed.
export type Scope = { label: string; everything: boolean; cycle?: string }

const collectibles = (n: number, formatted: string) => `${formatted} collectible${n === 1 ? '' : 's'}`
const cycleSuffix = (cycle?: string) => (cycle ? ` (${cycle})` : '')
const inCycle = (cycle?: string) => (cycle ? ` in ${cycle}` : '')
const scopeName = (scope: Scope) => `${scope.label}${cycleSuffix(scope.cycle)}`
// "everything" reads badly as a place ("in Everything"), so it gets its own phrase.
// The count is what changes, not the catalog total, so it never says "All N".
const acrossGame = (n: number, formatted: string, cycle?: string) =>
  `${formatted}${cycle ? ` ${cycle}` : ''} collectible${n === 1 ? '' : 's'} across the whole game`
// Only a mixed scope loses something: when all of it is in one state, the
// opposite action puts it back exactly.
const undoNote = (mixed: boolean) => (mixed ? " This can't be undone." : '')

export const BULK_COPY = {
  heading: 'Manage progress',
  description: 'Clear your progress, or mark everything as found, for the whole game, one level or one type.',
  scopeLabel: 'Scope',
  scopePlaceholder: 'Choose a scope',
  scopeEverything: 'Everything',
  groupLevels: 'Levels',
  groupOtherSources: 'Other Sources',
  groupCollectibles: 'Collectibles',
  groupUpgrades: 'Upgrades',
  groupCosmetics: 'Cosmetics',
  cycleLegend: 'Cycle',
  // "All", as the level and type pages' cycle filter says; the group's "Cycle"
  // legend names what it is all of, for screen readers too.
  cycleAll: 'All',
  clearButton: 'Clear progress',
  markButton: 'Mark all found',
  hintChooseScope: 'Choose a scope first.',
  counting: 'Counting…',
  nothingToClear: (scope: Scope) =>
    scope.everything
      ? `Nothing${inCycle(scope.cycle)} is marked found.`
      : `Nothing in ${scopeName(scope)} is marked found.`,
  nothingToMark: (scope: Scope) =>
    scope.everything
      ? `Every${scope.cycle ? ` ${scope.cycle}` : ''} collectible is already marked found.`
      : `Everything in ${scopeName(scope)} is already marked found.`,
  emptyScope: (scope: Scope) =>
    scope.everything
      ? `There are no${scope.cycle ? ` ${scope.cycle}` : ''} collectibles.`
      : `${scopeName(scope)} has no collectibles.`,
  previewError: "Couldn't count that. Please try again.",
  previewTimeout: 'Counting took too long. Please try again.',
  dialogTitleClear: 'Clear progress?',
  dialogTitleMarkFound: 'Mark all found?',
  dialogBodyClear: (n: number, formatted: string, scope: Scope, mixed: boolean) =>
    (scope.everything
      ? `${acrossGame(n, formatted, scope.cycle)} will be marked not found.`
      : `${collectibles(n, formatted)} in ${scopeName(scope)} will be marked not found.`) + undoNote(mixed),
  dialogBodyMarkFound: (n: number, formatted: string, scope: Scope, mixed: boolean) =>
    (scope.everything
      ? `${acrossGame(n, formatted, scope.cycle)} will be marked found.`
      : `${collectibles(n, formatted)} in ${scopeName(scope)} will be marked found.`) + undoNote(mixed),
  confirmWordLabel: (word: string) => `Type "${word}" to confirm`,
  confirmWord: 'everything',
  confirmClear: (formatted: string) => `Clear ${formatted}`,
  confirmMarkFound: (formatted: string) => `Mark ${formatted} found`,
  applying: 'Saving…',
  cancel: 'Cancel',
  close: 'Close',
  applyError: "Couldn't make that change. Please try again.",
  applyTimeout: 'This is taking too long. It may still have been saved; your progress above will update.',
  successClear: (n: number, formatted: string, scope: Scope) =>
    scope.everything
      ? `Cleared ${acrossGame(n, formatted, scope.cycle)}.`
      : `Cleared ${collectibles(n, formatted)} in ${scopeName(scope)}.`,
  successMarkFound: (n: number, formatted: string, scope: Scope) =>
    scope.everything
      ? `Marked ${acrossGame(n, formatted, scope.cycle)} as found.`
      : `Marked ${collectibles(n, formatted)} in ${scopeName(scope)} as found.`,
} as const
