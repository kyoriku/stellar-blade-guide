// The site's roles by rank, mirroring server/app/core/roles.py: a server test reads this
// file to keep the map and the fallback equal. A role outside these (typed by hand in
// SQL) ranks as a user. The server decides who may delete; this only decides what the
// page shows.
const USER_RANK = 1
const ROLE_RANK = new Map<string, number>([['user', USER_RANK], ['moderator', 2], ['admin', 3]])

export function roleRank(role: string | null | undefined): number {
  return ROLE_RANK.get(role ?? '') ?? USER_RANK
}

// Your own comment, or one whose author's role ranks below yours. A comment with no
// author (its account was deleted) counts as a user's, and a guest deletes nothing.
export function canDeleteComment(
  viewer: { id: number; role: string } | null,
  author: { id: number; role: string } | null,
): boolean {
  if (!viewer) return false
  if (author && author.id === viewer.id) return true
  return roleRank(author?.role) < roleRank(viewer.role)
}
