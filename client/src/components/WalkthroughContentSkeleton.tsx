import { Image as ImageIcon } from 'lucide-react'

function WalkthroughContentSkeleton() {
  return (
    <article className="relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800">
      <div className="relative">
        <div className="mb-3">
          <div className="h-7 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-700 rounded animate-pulse" style={{ width: '95%' }}></div>
          <div className="h-6 bg-gray-700 rounded animate-pulse" style={{ width: '80%' }}></div>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-500 animate-pulse" />
            </div>
          </div>
          <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default WalkthroughContentSkeleton;