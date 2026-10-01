import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import TopBar from './TopBar'
import Navbar from './Navbar'
import NoticeTicker from './NoticeTicker'
import Footer from './Footer'
import WhatsAppChat from '../ui/WhatsAppChat'
import PopupAd from '../ui/PopupAd'

export default function PublicLayout() {
  const { pathname } = useLocation()

  // Scroll to top on every route change
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  // Always use light mode on public pages
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navbar />
      <NoticeTicker />
      <main className="flex-1 page-enter">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppChat />
      <PopupAd />
    </div>
  )
}