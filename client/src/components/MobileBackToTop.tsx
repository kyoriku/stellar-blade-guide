import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function MobileBackToTop({ onScrollToTop }: { onScrollToTop?: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        history.replaceState(null, '', window.location.pathname);
        onScrollToTop?.()
      }}
      className="lg:hidden fixed bottom-6 left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-secondary border border-gray-700 hover:border-cyan-500/50 rounded-full shadow-lg shadow-black/40 text-sm font-medium text-gray-200 hover:text-white transition-all duration-200 cursor-pointer"
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4 text-cyan-400" />
      Top
    </button>
  )
}