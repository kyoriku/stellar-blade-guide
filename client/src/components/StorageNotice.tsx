import { STORAGE_COPY } from '../constants/storageCopy'

// What /login and /register show in their card, in place of the sign-in controls, when
// the browser refuses site storage or has none.
export default function StorageNotice({ problem, page }: {
  problem: 'blocked' | 'off'
  page: 'login' | 'register'
}) {
  return (
    <div className="space-y-2 text-sm text-gray-300">
      <p>{STORAGE_COPY[problem][page]}</p>
      <p>{STORAGE_COPY.guide}</p>
    </div>
  )
}
