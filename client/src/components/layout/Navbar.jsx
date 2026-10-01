import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBars, FaTimes, FaChevronDown, FaArrowRight,
  FaSchool, FaUserTie, FaUserGraduate,
  FaBookOpen, FaBuilding, FaClipboardList, FaPenFancy,
} from 'react-icons/fa'
import LOGO from '../../assets/logo.js'

const NAV = [
  { label: 'Home', to: '/', exact: true },
  {
    label: 'About', to: '/about',
    sub: [
      { label: 'About Kidland', to: '/about',   desc: 'Our story, vision and values',   Icon: FaSchool },
      { label: 'Faculty',       to: '/teachers', desc: 'Meet our educators',             Icon: FaUserTie },
      { label: 'Alumni',        to: '/alumni',   desc: 'Where our graduates go',         Icon: FaUserGraduate },
    ],
  },
  {
    label: 'Academic Programs', to: '/academics',
    sub: [
      { label: 'Curriculum',  to: '/academics',  desc: 'Montessori & national syllabus', Icon: FaBookOpen },
      { label: 'Facilities',  to: '/facilities', desc: 'Labs, library & sports',         Icon: FaBuilding },
    ],
  },
  {
    label: 'Admission', to: '/admission',
    sub: [
      { label: 'Admission Info', to: '/admission', desc: 'Process & requirements',       Icon: FaClipboardList },
      { label: 'Apply Online',   to: '/apply',     desc: 'Submit your application',      Icon: FaPenFancy },
    ],
  },
  { label: 'Events',  to: '/events' },
  { label: 'News',    to: '/news' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [scrolled,   setScrolled]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [drop,       setDrop]       = useState(null)
  const [mobileExp,  setMobileExp]  = useState(null)
  const loc   = useLocation()
  const timer = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setMobileOpen(false); setDrop(null); setMobileExp(null) }, [loc.pathname])

  const openDrop  = l => { clearTimeout(timer.current); setDrop(l) }
  const closeDrop = () => { timer.current = setTimeout(() => setDrop(null), 180) }

  return (
    <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[78px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src={LOGO} alt="Kidland School" className="h-14 w-auto object-contain"/>
            <div className="hidden sm:block leading-tight">
              {/* <div className="font-black text-gray-900 text-lg tracking-tight">Kidland School</div>
              <div className="text-[10px] font-semibold text-gray-400 tracking-[0.28em] uppercase">Duty · Honor · Country</div> */}
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV.map(n => {
              const isActive = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to) && n.to !== '/'
              return (
                <div key={n.label} className="relative"
                  onMouseEnter={() => n.sub && openDrop(n.label)}
                  onMouseLeave={closeDrop}>
                  {n.sub ? (
                    <button className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                      isActive || drop === n.label
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={isActive ? { background: '#fff0cc', color: '#111' } : {}}>
                      {n.label}
                      <FaChevronDown size={9} className={`transition-transform duration-200 ${drop === n.label ? 'rotate-180' : ''}`} style={{ color: '#54B435' }}/>
                    </button>
                  ) : (
                    <NavLink to={n.to} end={!!n.exact}
                      className={({ isActive }) =>
                        `block px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                          isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      style={({ isActive }) => isActive ? { background: '#fff0cc' } : {}}>
                      {n.label}
                    </NavLink>
                  )}

                  {/* Dropdown */}
                  <AnimatePresence>
                    {n.sub && drop === n.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.14 }}
                        onMouseEnter={() => openDrop(n.label)}
                        onMouseLeave={closeDrop}
                        className="absolute top-full left-0 w-60 bg-white rounded-xl shadow-2xl ring-1 ring-black/6 py-2 z-50 mt-1.5 overflow-hidden">
                        <div className="h-0.5 mx-3 mb-2 rounded-full" style={{ background: '#54B435' }}/>
                        {n.sub.map(s => (
                          <Link key={s.label} to={s.to}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f0fde8' }}>
                              <s.Icon size={13} style={{ color: '#54B435' }}/>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{s.label}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </nav>

          {/* Apply Now + hamburger */}
          <div className="flex items-center gap-3">
            <Link to="/apply"
              className="hidden sm:inline-flex items-center gap-2 font-bold text-white text-sm px-6 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
              style={{ background: '#54B435', boxShadow: '0 4px 14px rgba(84,180,53,0.35)' }}>
              Apply Now
            </Link>
            <button onClick={() => setMobileOpen(o => !o)}
              className="xl:hidden w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors">
              {mobileOpen ? <FaTimes size={16}/> : <FaBars size={16}/>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-3 space-y-0.5">
              {NAV.map(n => (
                <div key={n.label}>
                  {n.sub ? (
                    <>
                      <button onClick={() => setMobileExp(p => p === n.label ? null : n.label)}
                        className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                        {n.label} <FaChevronDown size={11} className={`transition-transform ${mobileExp === n.label ? 'rotate-180' : ''}`} style={{ color: '#54B435' }}/>
                      </button>
                      <AnimatePresence>
                        {mobileExp === n.label && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-3">
                            {n.sub.map(s => (
                              <Link key={s.label} to={s.to} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                <s.Icon size={13} style={{ color: '#54B435' }}/>{s.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <NavLink to={n.to} end={!!n.exact}
                      className={({ isActive }) => `block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                      style={({ isActive }) => isActive ? { background: '#fff8e6' } : {}}>
                      {n.label}
                    </NavLink>
                  )}
                </div>
              ))}
              <div className="pt-2 pb-3">
                <Link to="/apply" className="flex items-center justify-center gap-2 font-bold text-white text-sm py-3 rounded-full"
                  style={{ background: '#54B435' }}>
                  Apply Now <FaArrowRight size={12}/>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
