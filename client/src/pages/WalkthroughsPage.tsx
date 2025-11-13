// import { useEffect, useState } from 'react'
// import { useParams, Link } from 'react-router-dom'
// import { useWalkthrough } from '../hooks/useWalkthroughs'
// import { ApiError } from '../services/api'
// import { List, ArrowLeft, Book, Award } from 'lucide-react'
// import WalkthroughStep from '../components/WalkthroughStep'
// import ErrorPage from './ErrorPage'
// import TableOfContents from '../components/TableOfContents'
// import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'

// function WalkthroughPage() {
//   const { walkthroughId } = useParams<{ walkthroughId: string }>();
//   const id = parseInt(walkthroughId || '0');

//   const { data: walkthrough, isLoading, isError, error } = useWalkthrough(id);
//   const [activeSection, setActiveSection] = useState<string>('');

//   // Scroll spy effect
//   useEffect(() => {
//     const observerOptions = {
//       root: null,
//       rootMargin: '-80px 0px -80% 0px',
//       threshold: 0
//     };

//     const observerCallback = (entries: IntersectionObserverEntry[]) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           setActiveSection(entry.target.id);
//         }
//       });
//     };

//     const observer = new IntersectionObserver(observerCallback, observerOptions);
//     const sections = document.querySelectorAll('.walkthrough-step');
//     sections.forEach((section) => observer.observe(section));

//     return () => {
//       sections.forEach((section) => observer.unobserve(section));
//     };
//   }, [walkthrough]);

//   if (isNaN(id) || id <= 0) {
//     return <ErrorPage code={404} />;
//   }

//   // Loading state - matches LevelsPage
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-primary">
//         <div className="container mx-auto px-3 py-8">
//           <div className="flex gap-8">
//             <aside className="hidden lg:block w-64 flex-shrink-0">
//               <TableOfContentsSkeleton />
//             </aside>

//             <main className="flex-1 min-w-0">
//               <div className="mb-10">
//                 <h1 className="text-4xl md:text-5xl font-bold mb-4">
//                   <div className="h-10 md:h-14 w-80 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
//                   <span className="block text-2xl mt-2">
//                     <div className="h-6 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
//                   </span>
//                 </h1>

//                 <div className="flex flex-wrap gap-3">
//                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
//                     <div className="w-4 h-5 bg-blue-400/50 rounded animate-pulse"></div>
//                     <div className="h-4 w-24 bg-blue-300/30 rounded animate-pulse"></div>
//                   </div>
//                 </div>
//               </div>

//               <div className="lg:hidden mb-8">
//                 <TableOfContentsSkeleton />
//               </div>

//               <div className="space-y-4">
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} className="h-48 bg-secondary rounded-lg border border-gray-800 animate-pulse"></div>
//                 ))}
//               </div>
//             </main>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (isError) {
//     const apiError = error as ApiError;
//     return <ErrorPage code={apiError?.status || 500} />;
//   }

//   if (!walkthrough) {
//     return <ErrorPage code={404} />;
//   }

//   // Generate TOC - matches LevelsPage structure
//   const tocLinks = [{
//     mainLink: '#steps',
//     title: walkthrough.title,
//     subLinks: walkthrough.steps.map((step) => ({
//       href: `#step-${step.step_number}`,
//       title: `Step ${step.step_number}`
//     }))
//   }];

//   return (
//     <div className="min-h-screen bg-primary">
//       <div className="container mx-auto px-3 py-8">
//         <div className="flex gap-8">
//           {/* Sidebar - matches LevelsPage */}
//           <aside className="hidden lg:block w-64 flex-shrink-0">
//             <TableOfContents links={tocLinks} activeSection={activeSection} />
//           </aside>

//           <main className="flex-1 min-w-0">
//             {/* Header - matches LevelsPage exactly */}
//             <div className="mb-10">
//               <h1 className="text-4xl md:text-5xl font-bold mb-4">
//                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
//                   {walkthrough.title}
//                 </span>
//                 {walkthrough.subtitle && (
//                   <span className="block text-2xl text-gray-400 font-normal mt-2">
//                     {walkthrough.subtitle}
//                   </span>
//                 )}
//               </h1>

//               {/* Stats - matches LevelsPage style */}
//               <div className="flex flex-wrap gap-3">
//                 {walkthrough.level && (
//                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
//                     <Book className="w-4 h-4 text-blue-400" />
//                     <span className="text-sm font-medium text-gray-300">{walkthrough.level}</span>
//                   </div>
//                 )}

//                 {walkthrough.steps && (
//                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg">
//                     <List className="w-4 h-4 text-purple-400" />
//                     <span className="text-sm font-medium text-gray-300">
//                       {walkthrough.steps.length} {walkthrough.steps.length === 1 ? 'step' : 'steps'}
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* Prerequisites & Rewards - simplified */}
//               {(walkthrough.prerequisites && walkthrough.prerequisites.length > 0) && (
//                 <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
//                   <p className="text-sm font-medium text-gray-400 mb-2">Prerequisites</p>
//                   <ul className="text-sm text-gray-300 space-y-1">
//                     {walkthrough.prerequisites.map((prereq, idx) => (
//                       <li key={idx} className="flex gap-2">
//                         <span className="text-blue-400">•</span>
//                         <span>{prereq}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {(walkthrough.rewards && walkthrough.rewards.length > 0) && (
//                 <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Award className="w-4 h-4 text-purple-400" />
//                     <p className="text-sm font-medium text-gray-400">Rewards</p>
//                   </div>
//                   <ul className="text-sm text-gray-300 space-y-1">
//                     {walkthrough.rewards.map((reward, idx) => (
//                       <li key={idx} className="flex gap-2">
//                         <span className="text-blue-400">•</span>
//                         <span>{reward}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>

//             {/* Mobile TOC */}
//             <div className="lg:hidden mb-8">
//               <TableOfContents links={tocLinks} activeSection={activeSection} />
//             </div>

//             {/* Steps - matches CollectibleSection spacing */}
//             <section id="steps" className="mb-16 scroll-mt-4">
//               <div className="space-y-4">
//                 {walkthrough.steps.map((step) => (
//                   <div 
//                     key={step.step_number}
//                     id={`step-${step.step_number}`}
//                     className="walkthrough-step scroll-mt-24"
//                   >
//                     <WalkthroughStep step={step} />
//                   </div>
//                 ))}
//               </div>
//             </section>

//             {/* Footer - matches LevelsPage exactly */}
//             <div className="mt-16 pt-8 border-t border-gray-800">
//               <div className="flex justify-between items-center">
//                 <div className="text-gray-500 text-sm">
//                   Completed {walkthrough.title}
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm text-gray-400 mb-2">Continue browsing</p>
//                   <Link
//                     to="/"
//                     className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
//                   >
//                     <ArrowLeft className="w-4 h-4" />
//                     Back to Home
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default WalkthroughPage;

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWalkthrough } from '../hooks/useWalkthroughs'
import { ApiError } from '../services/api'
import { List, ArrowLeft, Book } from 'lucide-react'
import WalkthroughContent from '../components/WalkthroughContent'
import ErrorPage from './ErrorPage'
import TableOfContents from '../components/TableOfContents'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'

function WalkthroughPage() {
  const { walkthroughId } = useParams<{ walkthroughId: string }>();
  const id = parseInt(walkthroughId || '0');

  const { data: walkthrough, isLoading, isError, error } = useWalkthrough(id);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -80% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll('.walkthrough-content');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [walkthrough]);

  if (isNaN(id) || id <= 0) {
    return <ErrorPage code={404} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="container mx-auto px-3 py-8">
          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContentsSkeleton />
            </aside>

            <main className="flex-1 min-w-0">
              <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <div className="h-10 md:h-14 w-80 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                  <span className="block text-2xl mt-2">
                    <div className="h-6 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
                  </span>
                </h1>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-secondary rounded-lg border border-gray-800 animate-pulse"></div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const apiError = error as ApiError;
    return <ErrorPage code={apiError?.status || 500} />;
  }

  if (!walkthrough) {
    return <ErrorPage code={404} />;
  }

  // Generate TOC
  const tocLinks = [{
    mainLink: '#objectives',
    title: walkthrough.title,
    subLinks: walkthrough.objectives?.map((objective, idx) => ({
      href: `#objective-${idx}`,
      title: objective
    })) || []
  }];


  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents links={tocLinks} activeSection={activeSection} />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {walkthrough.title}
                </span>
                {walkthrough.subtitle && (
                  <span className="block text-2xl text-gray-400 font-normal mt-2">
                    {walkthrough.subtitle}
                  </span>
                )}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap gap-3">
                {walkthrough.level && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
                    <Book className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">{walkthrough.level}</span>
                  </div>
                )}
              </div>

              {/* Objectives */}
              {walkthrough.objectives && walkthrough.objectives.length > 0 && (
                <div id="objectives" className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <List className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-medium text-gray-400">Objectives</p>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {walkthrough.objectives.map((objective, idx) => (
                      <li key={idx}
                        id={`objective-${idx}`}
                        className="flex gap-2 walkthrough-content scroll-mt-24"
                      >
                        <span className="text-blue-400">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <TableOfContents links={tocLinks} activeSection={activeSection} />
            </div>

            {/* Content blocks */}
            <section className="mb-16 scroll-mt-4">
              <div className="space-y-4">
                {walkthrough.content.map((content) => (
                  <div
                    key={content.order}
                    id={`content-${content.order}`}
                    className="walkthrough-content scroll-mt-24"
                  >
                    <WalkthroughContent content={content} />
                  </div>
                ))}
              </div>
            </section>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <div className="text-gray-500 text-sm">
                  Completed {walkthrough.title}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-2">Continue browsing</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default WalkthroughPage;