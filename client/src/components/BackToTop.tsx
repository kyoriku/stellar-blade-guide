import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop({ onScrollToTop }: { onScrollToTop?: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        onScrollToTop?.()
      }}
      className={`hidden lg:flex items-center gap-2 px-4 py-2.5 w-full bg-secondary border border-gray-800 hover:border-cyan-500/50 rounded-lg text-sm font-medium text-gray-200 hover:text-white transition-all duration-300 cursor-pointer ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4 text-cyan-400" />
      Back to top
    </button>
  )
}