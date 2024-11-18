import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
import Collectibles from './pages/Collectibles/CollectibleTypesOverview.jsx';
import Error from './components/Error';
import AdminPage from './pages/AdminPage.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: 'admin', element: <PrivateRoute adminOnly><AdminPage /></PrivateRoute> },
      { path: 'collectibles/eidos-7', element: <Eidos7Collectibles /> },
      { path: 'collectibles/xion', element: <XionCollectibles /> },
      { path: 'collectibles/wasteland', element: <WastelandCollectibles /> },
      { path: 'collectibles/altess-levoire', element: <AltessLevoireCollectibles /> },
      { path: 'collectibles/matrix-11', element: <Matrix11Collectibles /> },
      { path: 'collectibles/great-desert', element: <GreatDesertCollectibles /> },
      { path: 'collectibles/abyss-levoire', element: <AbyssLevoireCollectibles /> },
      { path: 'collectibles/eidos-9', element: <Eidos9Collectibles /> },
      { path: 'collectibles/spire-4', element: <Spire4Collectibles /> },
      { path: 'collectibles/:type', element: <Collectibles /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);