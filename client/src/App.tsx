import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'
import LevelPage from './pages/LevelsPage'
import CollectibleTypePage from './pages/CollectiblesPage'
import ErrorPage from './pages/ErrorPage'
import WalkthroughsListPage from './pages/WalkhroughsListPage'
import WalkthroughDetailPage from './pages/WalkthroughDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="walkthroughs/:type" element={<WalkthroughsListPage />} />
          <Route path="walkthroughs/:type/:slug" element={<WalkthroughDetailPage />} />
          <Route path="levels/:levelName" element={<LevelPage />} />
          <Route path="collectibles/:typeName" element={<CollectibleTypePage />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;