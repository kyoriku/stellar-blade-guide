import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ScrollToTop from '../components/ScrollToTop'
import Footer from '../components/Footer'
import { useAuth } from '../hooks/useAuth'

function RootLayout() {
  const { isLoading } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1">
        {!isLoading && <Outlet />}
      </div>
      <Footer />
    </div>
  )
}

export default RootLayout