import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ScrollToTop from '../components/ScrollToTop'

function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
    </>
  )
}

export default RootLayout