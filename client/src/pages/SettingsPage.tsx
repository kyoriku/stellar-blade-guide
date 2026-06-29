import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, KeyRound, Trash2, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { readError, errorMessage } from '../services/api'
import { isValidUsername, USERNAME_RULE } from '../utils/validateUsername'
import SEO from '../components/SEO'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export default function SettingsPage() {
  const { user, authFetch, logout, refreshToken } = useAuth()
  const navigate = useNavigate()

  // ── Profile ────────────────────────────────────────────────────────────────
  // Note: this runs before the `if (!user)` guard below, so it must be null-safe.
  const [username, setUsername] = useState(user?.username ?? '')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // ── Password ───────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // ── Logout all ─────────────────────────────────────────────────────────────
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const [logoutAllError, setLogoutAllError] = useState<string | null>(null)

  // ── Delete account ─────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Guard goes here, AFTER every hook above — early-returning before the
  // useState calls would call hooks conditionally (Rules of Hooks violation).
  // Route is protected, so user is normally set; this is a defensive fallback.
  // Below this point TypeScript narrows `user` to non-null (it's a const, so the
  // narrowing carries into the handler closures and JSX).
  if (!user) return null

  // Profile dirty-check — shared by the Save button (disabled state) and the
  // save handler, so the button enables only when a save would actually change
  // something. An empty Avatar URL field means "no change" (use Remove to clear);
  // comparing it against the current avatar would otherwise wipe it on every save.
  const trimmedUsername = username.trim()
  const trimmedAvatarUrl = avatarUrl.trim()
  const usernameChanged = trimmedUsername !== user.username
  const avatarChanged = trimmedAvatarUrl !== '' && trimmedAvatarUrl !== (user.avatar_url ?? '')
  const hasProfileChanges = usernameChanged || avatarChanged
  // Mirror the server's username rule (see utils/validateUsername) so the button
  // reflects true validity. The save is one combined PATCH, so an invalid username
  // must block it even when only the avatar changed (else the request 422s and
  // nothing saves). The server stays the final authority (e.g. uniqueness).
  const usernameValid = isValidUsername(username)
  const canSaveProfile = hasProfileChanges && (!usernameChanged || usernameValid)

  const handleRemoveAvatar = async () => {
    setProfileError(null)
    setProfileSuccess(false)
    setProfileLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: '' }),
      })
      if (!res.ok) {
        throw new Error(await readError(res, 'Failed to remove avatar'))
      }
      await refreshToken()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(errorMessage(err, 'Failed to remove avatar'))
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setProfileLoading(true)
    try {
      const body: Record<string, string> = {}
      if (usernameChanged) body.username = trimmedUsername
      if (avatarChanged) body.avatar_url = trimmedAvatarUrl

      if (Object.keys(body).length === 0) {
        setProfileSuccess(true)
        return
      }

      const res = await authFetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(await readError(res, 'Failed to update profile'))
      }

      await res.json()  // consume response but don't need the data
      await refreshToken()
      setAvatarUrl('')
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(errorMessage(err, 'Failed to update profile'))
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    setPasswordLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })

      if (!res.ok) {
        throw new Error(await readError(res, 'Failed to change password'))
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => {
        // change-password revokes all sessions, redirect to login
        logout()
        navigate('/login')
      }, 2000)
    } catch (err) {
      setPasswordError(errorMessage(err, 'Failed to change password'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogoutAll = async () => {
    setLogoutAllError(null)
    setLogoutAllLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/logout-all`, { method: 'POST' })
      if (!res.ok) throw new Error(await readError(res, 'Failed to sign out of all devices'))
      logout()
      navigate('/login')
    } catch (err) {
      setLogoutAllError(errorMessage(err, 'Failed to sign out of all devices'))
    } finally {
      setLogoutAllLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/users/me`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await readError(res, 'Failed to delete account'))
      await logout()
      navigate('/')
    } catch (err) {
      setDeleteError(errorMessage(err, 'Failed to delete account'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-main bg-primary py-12 px-4">
      <SEO
        title="Settings"
        description=""
        noindex
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Account Settings</h1>

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <section className="bg-secondary border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-gray-100">Profile</h2>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileError && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                Profile updated successfully.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm"
                placeholder="yourname"
              />
              <p className={`mt-1.5 text-xs ${usernameChanged && !usernameValid ? 'text-red-400' : 'text-gray-400'}`}>
                {USERNAME_RULE}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            {/* Avatar preview */}
            {user.avatar_url && (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url}
                  alt="Current avatar"
                  className="w-10 h-10 rounded-full object-cover border border-gray-700"
                />
                <span className="text-xs text-gray-400">Current avatar</span>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileLoading || !canSaveProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all duration-200 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {profileLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Security ────────────────────────────────────────────────────── */}
        <section className="bg-secondary border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-gray-100">Security</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                Password changed. Signing you out...
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Current password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Minimum 8 characters.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all duration-200 cursor-pointer"
              >
                {passwordLoading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Sign out of all devices</p>
                <p className="text-xs text-gray-400 mt-0.5">Revokes all active sessions everywhere.</p>
              </div>
              <button
                onClick={handleLogoutAll}
                disabled={logoutAllLoading}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 cursor-pointer"
              >
                {logoutAllLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
            {logoutAllError && (
              <p className="mt-2 text-xs text-red-400">{logoutAllError}</p>
            )}
          </div>
        </section>

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        <section className="bg-secondary border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-gray-100">Danger Zone</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>

          {deleteError && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {deleteError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Type <span className="text-white font-mono">{user.username}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-primary border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors text-sm"
                placeholder={user.username}
              />
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== user.username || deleteLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-red-400 font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? 'Deleting...' : 'Delete my account'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}