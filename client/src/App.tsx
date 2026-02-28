import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'

// Index pages
import WalkthroughsIndexPage from './pages/WalkthroughsIndexPage'
import LevelsIndexPage from './pages/LevelsIndexPage'
import CollectiblesIndexPage from './pages/CollectiblesIndexPage'
import UpgradesIndexPage from './pages/UpgradesIndexPage'
import MaterialsIndexPage from './pages/MaterialsIndexPage'
import CosmeticsIndexPage from './pages/CosmeticsIndexPage'

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

// Auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SettingsPage from './pages/SettingsPage'

// Components
import ProtectedRoute from './components/ProtectedRoute'

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

          <Route path="upgrades" element={<UpgradesIndexPage />} />
          <Route path="upgrades/:typeName" element={<CollectibleTypePage />} />

          <Route path="materials" element={<MaterialsIndexPage />} />
          <Route path="materials/:typeName" element={<CollectibleTypePage />} />

          <Route path="cosmetics" element={<CosmeticsIndexPage />} />
          <Route path="cosmetics/:typeName" element={<CollectibleTypePage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

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