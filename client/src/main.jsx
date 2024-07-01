import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx'
import Home from './pages/Home.jsx';
import Eidos7Collectibles from './pages/Collectibles/Eidos7Collectibles.jsx';
import XionCollectibles from './pages/Collectibles/XionCollectibles.jsx';
import WastelandCollectibles from './pages/Collectibles/WastelandCollectibles.jsx';
import AltessLevoireCollectibles from './pages/Collectibles/AltessLevoireCollectibles.jsx';
import Error from './components/Error';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'collectibles/eidos-7',
        element: <Eidos7Collectibles />,
      },
      {
        path: 'collectibles/xion',
        element: <XionCollectibles />,
      },
      {
        path: 'collectibles/wasteland',
        element: <WastelandCollectibles />,
      },
      {
        path: 'collectibles/altess-levoire',
        element: <AltessLevoireCollectibles />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)