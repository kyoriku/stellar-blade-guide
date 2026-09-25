import { List } from 'lucide-react';

function TableOfContentsSkeleton() {
  return (
    <nav
      // The sticky lives here, not on a page wrapper as it does for the loaded
      // TOC — the three loading asides render this component bare. So the
      // offset is repeated here, or the sidebar jumps when content lands. It
      // must stay identical to the three pages' wrappers.
      //
      // The caps stay 4rem SMALLER than TableOfContents', which is not drift:
      // the loaded panel has a Back to top button under it (12px mt-3 + 42px
      // button) plus the wrapper's pb-4, about 70px this never has to reserve.
      className="sticky top-[calc(var(--nav-height)+2rem)] bg-secondary rounded-lg p-3 max-h-[calc(100vh-3rem-var(--nav-height))] overflow-hidden border border-gray-800 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <List className="w-5 h-5 text-cyan-400" />
        </div>
        <h4 className="text-xl font-bold text-white">Contents</h4>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-11rem-var(--nav-height))] custom-scrollbar pr-2">
        <ul className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <li key={i} className="group">
              <div className="flex items-center gap-2 text-sm font-medium py-2 rounded-lg border-l-2 border-transparent">
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
    </nav>
  );
}

export default TableOfContentsSkeleton;