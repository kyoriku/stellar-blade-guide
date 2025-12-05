import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'

// Index pages
import WalkthroughsIndexPage from './pages/WalkthroughsIndexPage'
import LevelsIndexPage from './pages/LevelsIndexPage'
import CollectiblesIndexPage from './pages/CollectiblesIndexPage'

// Detail pages
import WalkthroughsListPage from './pages/WalkhroughsListPage'
import WalkthroughDetailPage from './pages/WalkthroughDetailPage'
import LevelPage from './pages/LevelsPage'
import CollectibleTypePage from './pages/CollectiblesPage'

// Legal pages
import Disclaimer from './pages/Disclaimer'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ErrorPage from './pages/ErrorPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />

          {/* Walkthroughs */}
          <Route path="walkthroughs" element={<WalkthroughsIndexPage />} />
          <Route path="walkthroughs/:type" element={<WalkthroughsListPage />} />
          <Route path="walkthroughs/:type/:slug" element={<WalkthroughDetailPage />} />

          {/* Levels */}
          <Route path="levels" element={<LevelsIndexPage />} />
          <Route path="levels/:levelName" element={<LevelPage />} />

          {/* Collectibles */}
          <Route path="collectibles" element={<CollectiblesIndexPage />} />
          <Route path="collectibles/:typeName" element={<CollectibleTypePage />} />

          {/* Legal Pages */}
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;