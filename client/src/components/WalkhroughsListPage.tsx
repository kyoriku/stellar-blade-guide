// pages/WalkthroughsListPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useWalkthroughsByType } from '../hooks/useWalkthroughs';

export default function WalkthroughsListPage() {
  const { type } = useParams<{ type: string }>();
  const { data: walkthroughs, isLoading, error } = useWalkthroughsByType(type!);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading walkthroughs</div>;
  if (!walkthroughs) return null;

  // Format the type for display
  const displayType = type?.replace('-', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{displayType}</h1>
      
      <div className="space-y-4">
        {walkthroughs.map((walkthrough) => (
          <Link
            key={walkthrough.id}
            to={`/walkthroughs/${type}/${walkthrough.slug}`}
            className="block p-6 border rounded-lg hover:bg-gray-50 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">
              {walkthrough.title}
            </h2>
            {walkthrough.subtitle && (
              <p className="text-gray-600 mb-2">{walkthrough.subtitle}</p>
            )}
            {walkthrough.level && (
              <p className="text-sm text-gray-500">Level: {walkthrough.level}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}