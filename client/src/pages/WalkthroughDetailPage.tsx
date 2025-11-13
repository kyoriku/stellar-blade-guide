// // // pages/WalkthroughDetailPage.tsx

// // import { useParams, Link } from 'react-router-dom';
// // import { useWalkthrough } from '../hooks/useWalkthroughs';

// // export default function WalkthroughDetailPage() {
// //   const { type, slug } = useParams<{ type: string; slug: string }>();
// //   const { data: walkthrough, isLoading, error } = useWalkthrough(type!, slug!);

// //   if (isLoading) return <div>Loading...</div>;
// //   if (error) return <div>Error loading walkthrough</div>;
// //   if (!walkthrough) return null;

// //   return (
// //     <div className="container mx-auto px-4 py-8 max-w-4xl">
// //       {/* Breadcrumbs */}
// //       <nav className="mb-6 text-sm text-gray-600">
// //         <Link to="/walkthroughs" className="hover:text-gray-900">Walkthroughs</Link>
// //         <span className="mx-2">/</span>
// //         <Link to={`/walkthroughs/${type}`} className="hover:text-gray-900">
// //           {type?.replace('-', ' ')}
// //         </Link>
// //         <span className="mx-2">/</span>
// //         <span className="text-gray-900">{walkthrough.title}</span>
// //       </nav>

// //       {/* Header */}
// //       <div className="mb-8">
// //         <h1 className="text-4xl font-bold mb-2">{walkthrough.title}</h1>
// //         {walkthrough.subtitle && (
// //           <p className="text-xl text-gray-600 mb-4">{walkthrough.subtitle}</p>
// //         )}
// //         {walkthrough.level && (
// //           <p className="text-sm text-gray-500">Level: {walkthrough.level}</p>
// //         )}
// //       </div>

// //       {/* Objectives */}
// //       {walkthrough.objectives && walkthrough.objectives.length > 0 && (
// //         <div className="mb-8 p-4 bg-blue-50 rounded-lg">
// //           <h2 className="text-xl font-semibold mb-2">Objectives</h2>
// //           <ul className="list-disc list-inside space-y-1">
// //             {walkthrough.objectives.map((objective, index) => (
// //               <li key={index}>{objective}</li>
// //             ))}
// //           </ul>
// //         </div>
// //       )}

// //       {/* Content */}
// //       <div className="space-y-6">
// //         {walkthrough.content.map((section) => (
// //           <div key={section.order} className="border-b pb-6">
// //             {section.section_title && (
// //               <h2 className="text-2xl font-semibold mb-3">{section.section_title}</h2>
// //             )}
            
// //             <p className="text-gray-700 mb-4 leading-relaxed">{section.text}</p>

// //             {/* Tip */}
// //             {section.tip && (
// //               <div className="p-3 bg-green-50 border-l-4 border-green-500 mb-4">
// //                 <p className="text-sm">
// //                   <strong>Tip:</strong> {section.tip}
// //                 </p>
// //               </div>
// //             )}

// //             {/* Warning */}
// //             {section.warning && (
// //               <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 mb-4">
// //                 <p className="text-sm">
// //                   <strong>Warning:</strong> {section.warning}
// //                 </p>
// //               </div>
// //             )}

// //             {/* Boss Info */}
// //             {section.is_boss && section.boss_info && (
// //               <div className="p-4 bg-red-50 rounded-lg mb-4">
// //                 <h3 className="text-xl font-bold mb-2">Boss: {section.boss_info.name}</h3>
// //                 {section.boss_info.balance_diamonds && (
// //                   <p className="text-sm mb-2">
// //                     Balance Diamonds: {section.boss_info.balance_diamonds}
// //                   </p>
// //                 )}
// //                 {section.boss_info.key_attacks && section.boss_info.key_attacks.length > 0 && (
// //                   <div>
// //                     <p className="font-semibold mb-1">Key Attacks:</p>
// //                     <ul className="list-disc list-inside space-y-1 text-sm">
// //                       {section.boss_info.key_attacks.map((attack, idx) => (
// //                         <li key={idx}>{attack}</li>
// //                       ))}
// //                     </ul>
// //                   </div>
// //                 )}
// //               </div>
// //             )}

// //             {/* Images */}
// //             {section.images.length > 0 && (
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 {section.images.map((image) => (
// //                   <img
// //                     key={image.order}
// //                     src={image.url}
// //                     alt={image.alt}
// //                     className="rounded-lg shadow-md w-full"
// //                   />
// //                 ))}
// //               </div>
// //             )}
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

// import { useEffect, useState } from 'react'
// import { useParams, Link } from 'react-router-dom'
// import { useWalkthrough } from '../hooks/useWalkthroughs'
// import { ApiError } from '../services/api'
// import { List, ArrowLeft, Book } from 'lucide-react'
// import WalkthroughContent from '../components/WalkthroughContent'
// import ErrorPage from './ErrorPage'
// import TableOfContents from '../components/TableOfContents'
// import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'

// function WalkthroughPage() {
//   const { type, slug } = useParams<{ type: string; slug: string }>();

//   const { data: walkthrough, isLoading, isError, error } = useWalkthrough(type!, slug!);
//   const [activeSection, setActiveSection] = useState<string>('');

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
//     const sections = document.querySelectorAll('.walkthrough-content');
//     sections.forEach((section) => observer.observe(section));

//     return () => {
//       sections.forEach((section) => observer.unobserve(section));
//     };
//   }, [walkthrough]);

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

//   // Format type for display
//   const displayType = type?.split('-').map(word => 
//     word.charAt(0).toUpperCase() + word.slice(1)
//   ).join(' ');

//   // Generate TOC from content sections
//   const tocLinks = walkthrough.objectives && walkthrough.objectives.length > 0
//     ? [{
//         mainLink: '#objectives',
//         title: 'Objectives',
//         subLinks: walkthrough.objectives.map((objective, idx) => ({
//           href: `#objective-${idx}`,
//           title: objective
//         }))
//       }]
//     : [];

//   // Add content sections to TOC
//   walkthrough.content.forEach((content) => {
//     if (content.section_title) {
//       tocLinks.push({
//         mainLink: `#section-${content.order}`,
//         title: content.section_title,
//         subLinks: []
//       });
//     }
//   });

//   return (
//     <div className="min-h-screen bg-primary">
//       <div className="container mx-auto px-3 py-8">
//         <div className="flex gap-8">
//           {/* Sidebar */}
//           <aside className="hidden lg:block w-64 flex-shrink-0">
//             <TableOfContents links={tocLinks} activeSection={activeSection} />
//           </aside>

//           <main className="flex-1 min-w-0">
//             {/* Breadcrumbs */}
//             <nav className="mb-4 text-sm text-gray-400">
//               <Link to="/" className="hover:text-white transition-colors">Home</Link>
//               <span className="mx-2">/</span>
//               <Link to={`/walkthroughs/${type}`} className="hover:text-white transition-colors">
//                 {displayType}
//               </Link>
//               <span className="mx-2">/</span>
//               <span className="text-white">{walkthrough.title}</span>
//             </nav>

//             {/* Header */}
//             <div className="mb-6">
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

//               {/* Meta */}
//               {walkthrough.level && (
//                 <div className="flex flex-wrap gap-3">
//                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
//                     <Book className="w-4 h-4 text-blue-400" />
//                     <span className="text-sm font-medium text-gray-300">{walkthrough.level}</span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Objectives */}
//             {walkthrough.objectives && walkthrough.objectives.length > 0 && (
//               <div id="objectives" className="mb-6 p-4 bg-secondary rounded-lg border border-gray-800">
//                 <div className="flex items-center gap-2 mb-3">
//                   <List className="w-5 h-5 text-purple-400" />
//                   <h2 className="text-lg font-semibold text-white">Objectives</h2>
//                 </div>
//                 <ul className="space-y-2">
//                   {walkthrough.objectives.map((objective, idx) => (
//                     <li
//                       key={idx}
//                       id={`objective-${idx}`}
//                       className="flex gap-2 walkthrough-content scroll-mt-24"
//                     >
//                       <span className="text-blue-400 font-bold">•</span>
//                       <span className="text-gray-300">{objective}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Mobile TOC */}
//             <div className="lg:hidden mb-6">
//               <TableOfContents links={tocLinks} activeSection={activeSection} />
//             </div>

//             {/* Content sections */}
//             <section className="mb-16 space-y-4">
//               {walkthrough.content.map((content) => (
//                 <div
//                   key={content.order}
//                   id={`section-${content.order}`}
//                   className="walkthrough-content scroll-mt-24"
//                 >
//                   <WalkthroughContent content={content} />
//                 </div>
//               ))}
//             </section>

//             {/* Footer */}
//             <div className="mt-16 pt-8 border-t border-gray-800">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <div className="text-gray-500 text-sm">
//                   Completed {walkthrough.title}
//                 </div>
//                 <div className="flex gap-3">
//                   <Link
//                     to={`/walkthroughs/${type}`}
//                     className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-all duration-200"
//                   >
//                     <ArrowLeft className="w-4 h-4" />
//                     Back to {displayType}
//                   </Link>
//                   <Link
//                     to="/"
//                     className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
//                   >
//                     Home
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
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import WalkthroughContent from '../components/WalkthroughContent'
import ErrorPage from './ErrorPage'
import TableOfContents from '../components/TableOfContents'
import TableOfContentsSkeleton from '../components/TableOfContentsSkeleton'

function WalkthroughPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();

  const { data: walkthrough, isLoading, isError, error } = useWalkthrough(type!, slug!);
  const [activeSection, setActiveSection] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collect all images when walkthrough loads
  useEffect(() => {
    if (walkthrough) {
      const images: Array<{ src: string; alt: string }> = [];
      walkthrough.content.forEach(content => {
        content.images?.forEach(img => {
          images.push({ src: img.url, alt: img.alt });
        });
      });
      setAllImages(images);
    }
  }, [walkthrough]);

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

  const handleImageClick = (imageUrl: string) => {
    const index = allImages.findIndex(img => img.src === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

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

  // Format type for display
  const displayType = type?.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Generate TOC from content sections
  const tocLinks = walkthrough.objectives && walkthrough.objectives.length > 0
    ? [{
        mainLink: '#objectives',
        title: 'Objectives',
        subLinks: walkthrough.objectives.map((objective, idx) => ({
          href: `#objective-${idx}`,
          title: objective
        }))
      }]
    : [];

  // Add content sections to TOC
  walkthrough.content.forEach((content) => {
    if (content.section_title) {
      tocLinks.push({
        mainLink: `#section-${content.order}`,
        title: content.section_title,
        subLinks: []
      });
    }
  });

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-3 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents links={tocLinks} activeSection={activeSection} />
          </aside>

          <main className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            <nav className="mb-4 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to={`/walkthroughs/${type}`} className="hover:text-white transition-colors">
                {displayType}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">{walkthrough.title}</span>
            </nav>

            {/* Header */}
            <div className="mb-6">
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
              {walkthrough.level && (
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg">
                    <Book className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">{walkthrough.level}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Objectives */}
            {walkthrough.objectives && walkthrough.objectives.length > 0 && (
              <div id="objectives" className="mb-6 p-4 bg-secondary rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <List className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Objectives</h2>
                </div>
                <ul className="space-y-2">
                  {walkthrough.objectives.map((objective, idx) => (
                    <li
                      key={idx}
                      id={`objective-${idx}`}
                      className="flex gap-2 walkthrough-content scroll-mt-24"
                    >
                      <span className="text-blue-400 font-bold">•</span>
                      <span className="text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile TOC */}
            <div className="lg:hidden mb-6">
              <TableOfContents links={tocLinks} activeSection={activeSection} />
            </div>

            {/* Content sections */}
            <section className="mb-16 space-y-4">
              {walkthrough.content.map((content) => (
                <div
                  key={content.order}
                  id={`section-${content.order}`}
                  className="walkthrough-content scroll-mt-24"
                >
                  <WalkthroughContent 
                    content={content} 
                    onImageClick={handleImageClick}
                  />
                </div>
              ))}
            </section>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-gray-500 text-sm">
                  Completed {walkthrough.title}
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/walkthroughs/${type}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {displayType}
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                  >
                    Home
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={allImages}
        index={lightboxIndex}
        plugins={[Zoom]}
        zoom={{ scrollToZoom: true }}
        controller={{ closeOnBackdropClick: true }}
        animation={{ fade: 300, swipe: 300 }}
        carousel={{ padding: isMobile ? "0%" : "4%" }}
        styles={{
          container: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(5px)"
          }
        }}
      />
    </div>
  );
}

export default WalkthroughPage;