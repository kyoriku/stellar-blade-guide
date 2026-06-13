// import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ScrollToTop from '../components/ScrollToTop'
import Footer from '../components/Footer'

function RootLayout() {
  // useEffect(() => {
  //   if ('scrollRestoration' in window.history) {
  //     window.history.scrollRestoration = 'manual';
  //   }
  // }, []);

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      {/* <div className="flex flex-col min-h-dvh bg-primary"> */}
      <ScrollToTop />
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default RootLayout