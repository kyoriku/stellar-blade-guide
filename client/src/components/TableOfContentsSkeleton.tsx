import { List, ChevronDown } from 'lucide-react';

interface TableOfContentsSkeletonProps {
  collapsible?: boolean;
}

function TableOfContentsSkeleton({ collapsible = false }: TableOfContentsSkeletonProps) {
  if (collapsible) {
    return (
      <nav className="bg-secondary rounded-lg border border-gray-800 shadow-xl">
        <div className="flex items-center gap-3 w-full p-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <List className="w-5 h-5 text-cyan-400" />
          </div>
          <h4 className="text-xl font-bold text-white flex-1">Contents</h4>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-4 bg-secondary rounded-lg p-3 max-h-[calc(100vh-2rem)] overflow-hidden border border-gray-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <List className="w-5 h-5 text-cyan-400" />
        </div>
        <h4 className="text-xl font-bold text-white">Contents</h4>
      </div>

      {/* Links */}
      <div className="overflow-y-auto max-h-[calc(100vh-10rem)] custom-scrollbar pr-2">
        <ul className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <li key={i} className="group">
              <div className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg border-l-2 border-transparent">
                <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                <div
                  className="h-4 bg-gray-700 rounded animate-pulse flex-1"
                  style={{ maxWidth: `${60 + (i * 7) % 40}%` }}
                ></div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </nav>
  );
}

export default TableOfContentsSkeleton;