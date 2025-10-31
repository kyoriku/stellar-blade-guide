import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Eidos7Collectibles from './pages/Collectibles/Eidos7Collectibles.jsx';
import XionCollectibles from './pages/Collectibles/XionCollectibles.jsx';
import WastelandCollectibles from './pages/Collectibles/WastelandCollectibles.jsx';
import AltessLevoireCollectibles from './pages/Collectibles/AltessLevoireCollectibles.jsx';
import Matrix11Collectibles from './pages/Collectibles/Matrix11Collectibles.jsx';
import GreatDesertCollectibles from './pages/Collectibles/GreatDesertCollectibles.jsx';
import AbyssLevoireCollectibles from './pages/Collectibles/AbyssLevoireCollectibles.jsx';
import Eidos9Collectibles from './pages/Collectibles/Eidos9Collectibles.jsx';
import Spire4Collectibles from './pages/Collectibles/Spire4Collectibles.jsx';
import CollectibleTypes from './pages/Collectibles/CollectibleTypesOverview.jsx';
import LevelCollectibles from './pages/Collectibles/LevelCollectibles.jsx';
import Error from './components/Error';
import AdminPage from './pages/AdminPage.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
      retry: 1, // Retry failed requests once
    },
  },
});

// Create the router
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: 'admin', element: <PrivateRoute adminOnly><AdminPage /></PrivateRoute> },
      { path: 'collectibles/level/:level', element: <LevelCollectibles /> },
      // { path: 'collectibles/eidos-7', element: <Eidos7Collectibles /> },
      // { path: 'collectibles/xion', element: <XionCollectibles /> },
      // { path: 'collectibles/wasteland', element: <WastelandCollectibles /> },
      // { path: 'collectibles/altess-levoire', element: <AltessLevoireCollectibles /> },
      // { path: 'collectibles/matrix-11', element: <Matrix11Collectibles /> },
      // { path: 'collectibles/great-desert', element: <GreatDesertCollectibles /> },
      // { path: 'collectibles/abyss-levoire', element: <AbyssLevoireCollectibles /> },
      // { path: 'collectibles/eidos-9', element: <Eidos9Collectibles /> },
      // { path: 'collectibles/spire-4', element: <Spire4Collectibles /> },
      { path: 'collectibles/type/:type', element: <CollectibleTypes /> },
    ],
  },
]);

// Wrap RouterProvider with QueryClientProvider
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
  // </React.StrictMode>
);