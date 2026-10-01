import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, Link, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  FaTachometerAlt, FaNewspaper, FaCalendarAlt, FaImages, FaBell,
  FaChalkboardTeacher, FaUserGraduate, FaUsers, FaCog, FaBars,
  FaTimes, FaMoon, FaSun, FaSignOutAlt, FaChevronLeft, FaChevronRight,
  FaExternalLinkAlt, FaWhatsapp, FaGraduationCap, FaChartBar, FaEnvelope,
  FaCamera, FaKey, FaUser, FaEdit, FaCheck, FaShieldAlt,
  FaMoneyBillWave, FaLayerGroup, FaTags, FaBook, FaSearch,
  FaFileAlt, FaExclamationTriangle, FaPercentage, FaChartLine,
  FaUserEdit, FaBuilding, FaHandHolding, FaUndo, FaSyncAlt, FaGavel,
  FaRoute, FaBus, FaMapMarkerAlt, FaIdCard, FaTools, FaGasPump,
  FaClipboardList, FaClipboardCheck,
  FaCalendarCheck,
} from 'react-icons/fa'
import NotificationBell from '../lms/NotificationBell'
import toast from 'react-hot-toast'
import api from '../../services/api'
import LOGO from '../../assets/logo.js'
import { canAccess, moduleForAdminPath } from '../../config/permissions'

const NAV = [
  { icon: FaTachometerAlt,       label: 'Dashboard',       to: '/admin',                    end: true  },
  { icon: FaNewspaper,           label: 'News',             to: '/admin/news', permission:'news'        },
  { icon: FaCalendarAlt,         label: 'Events',           to: '/admin/events', permission:'events'      },
  { icon: FaImages,              label: 'Gallery',          to: '/admin/gallery', permission:'gallery'     },
  { icon: FaBell,                label: 'Notices',           to: '/admin/notices', permission:'notices'    },
  { icon: FaChalkboardTeacher,   label: 'Teachers',         to: '/admin/teachers', permission:'teachers'  },
  { icon: FaGraduationCap,       label: 'Alumni',           to: '/admin/alumni', permission:'alumni'      },
  { icon: FaChartBar,            label: 'Results',          to: '/admin/results', permission:'results'     },
  { icon: FaUserGraduate,        label: 'Admissions',       to: '/admin/admissions', permission:'admissions' },
  { icon: FaEnvelope,            label: 'Contacts',         to: '/admin/contacts', permission:'contacts'   },
  { icon: FaWhatsapp,            label: 'WhatsApp',         to: '/admin/whatsapp', permission:'whatsapp'   },
  // ── FEES MANAGEMENT ──────────────────────────────────────────────────────────
  { header: 'Fees Management', icon: FaMoneyBillWave },
  { icon: FaLayerGroup,          label: 'Fee Groups',       to: '/admin/fees/groups', permission:'fees'   },
  { icon: FaTags,                label: 'Fee Types',        to: '/admin/fees/types', permission:'fees'     },
  { icon: FaFileAlt,             label: 'Fees Master',      to: '/admin/fees/master', permission:'fees'    },
  { icon: FaMoneyBillWave,       label: 'Collect Fees',     to: '/admin/fees/collect', permission:'fees'  },
  { icon: FaSearch,              label: 'Search Payments',  to: '/admin/fees/payments', permission:'fees' },
  { icon: FaChartLine,           label: 'Fees Statement',   to: '/admin/fees/statement', permission:'fees' },
  { icon: FaExclamationTriangle, label: 'Fees Due',         to: '/admin/fees/due', permission:'fees'       },
  { icon: FaPercentage,          label: 'Discounts',        to: '/admin/fees/discounts', permission:'fees' },
  { icon: FaChartBar,            label: 'Fee Reports',      to: '/admin/fees/reports', permission:'fees'    },
  // ── LIBRARY ──────────────────────────────────────────────────────────────────
  { header: 'Library', icon: FaBook },
  { icon: FaLayerGroup,          label: 'Book Categories',  to: '/admin/library/categories'             },
  { icon: FaUserEdit,            label: 'Authors',          to: '/admin/library/authors'                },
  { icon: FaBuilding,            label: 'Publishers',       to: '/admin/library/publishers'             },
  { icon: FaBook,                label: 'Books',            to: '/admin/library/books'                  },
  { icon: FaHandHolding,         label: 'Issue Book',       to: '/admin/library/issue'                  },
  { icon: FaUndo,                label: 'Return Book',      to: '/admin/library/return'                 },
  { icon: FaSyncAlt,             label: 'Renewals',         to: '/admin/library/renewals'               },
  { icon: FaGavel,               label: 'Fine Collection',  to: '/admin/library/fines'                  },
  { icon: FaChartBar,            label: 'Library Reports',  to: '/admin/library/reports'                },
  // ── TRANSPORTATION ───────────────────────────────────────────────────────────
  { header: 'Transportation', icon: FaBus },
  { icon: FaTachometerAlt,       label: 'Transport Dashboard', to: '/admin/transport'                   },
  { icon: FaRoute,               label: 'Routes',              to: '/admin/transport/routes'            },
  { icon: FaMapMarkerAlt,        label: 'Route Stops',         to: '/admin/transport/stops'             },
  { icon: FaBus,                 label: 'Vehicles',            to: '/admin/transport/vehicles'          },
  { icon: FaIdCard,              label: 'Drivers',             to: '/admin/transport/drivers'           },
  { icon: FaUsers,               label: 'Vehicle Staff',       to: '/admin/transport/staff'             },
  { icon: FaUserGraduate,        label: 'Student Transport',   to: '/admin/transport/students'          },
  { icon: FaMoneyBillWave,       label: 'Transport Fees',      to: '/admin/transport/fees'              },
  { icon: FaClipboardCheck,      label: 'Pickup / Drop-off',   to: '/admin/transport/attendance'        },
  { icon: FaTools,               label: 'Maintenance',         to: '/admin/transport/maintenance'       },
  { icon: FaGasPump,             label: 'Fuel Management',     to: '/admin/transport/fuel'              },
  { icon: FaClipboardList,       label: 'Transport Reports',   to: '/admin/transport/reports'           },
  // ── ATTENDANCE & TIMETABLE ───────────────────────────────────────────────
  { header: 'Attendance & Timetable', icon: FaCalendarCheck },
  { icon: FaCalendarCheck,       label: 'Take Attendance',      to: '/admin/attendance/take', permission:'attendance' },
  { icon: FaCalendarAlt,         label: 'Timetable',             to: '/admin/timetable', permission:'attendance' },
  { icon: FaChartBar,             label: 'Attendance Reports',    to: '/admin/attendance/reports', permission:'attendance' },
  // ── LEARNING MANAGEMENT ────────────────────────────────────────────────────
  { header: 'Learning Management', icon: FaGraduationCap },
  { icon: FaGraduationCap,        label: 'LMS Dashboard',       to: '/admin/lms', end: true              },
  { icon: FaBook,                 label: 'Course Management',   to: '/admin/lms/courses'                 },
  { icon: FaClipboardList,        label: 'Assignments',         to: '/admin/lms/assignments'             },
  { icon: FaClipboardCheck,       label: 'Quizzes',              to: '/admin/lms/quizzes'                },
  { icon: FaFileAlt,              label: 'Learning Materials',   to: '/admin/lms/materials'             },
  { icon: FaChartBar,              label: 'LMS Reports',           to: '/admin/lms/reports'                 },
  { icon: FaBuilding,              label: 'Academic Setup',        to: '/admin/lms/academic', superOnly: true },
  // ── SYSTEM ───────────────────────────────────────────────────────────────────
  { header: 'System', icon: FaCog },
  { icon: FaUsers,               label: 'Users',               to: '/admin/users',  permission: 'roles' },
  { icon: FaShieldAlt,           label: 'Roles & Permissions', to: '/admin/roles',  permission: 'roles' },
  { icon: FaClipboardList,       label: 'Audit Log',           to: '/admin/audit',  permission: 'audit' },
  { icon: FaCog,                 label: 'Settings',            to: '/admin/settings'                   },
]

const EW = 224   // expanded width px
const CW = 68    // collapsed width px

// ─── Sidebar Nav (defined OUTSIDE AdminLayout so React never remounts it) ─────
// This is critical: defining a component INSIDE another component creates a new
// component type on every render, causing React to unmount + remount the child
// (losing scroll position, focus, animation state, etc.)
const SidebarNav = ({ exp, mobile, isSuperAdmin, onMobileClose, onLogout, user }) => {
  const can = (module) => canAccess(user, module, 'view')
  const location = useLocation()
  const sectionForPath = (pathname) => {
    if (pathname.startsWith('/admin/fees/')) return 'Fees Management'
    if (pathname.startsWith('/admin/library/')) return 'Library'
    if (pathname.startsWith('/admin/transport')) return 'Transportation'
    if (pathname.startsWith('/admin/lms')) return 'Learning Management'
    if (pathname === '/admin/users' || pathname === '/admin/settings') return 'System'
    return 'Fees Management'
  }
  const [openSection, setOpenSection] = useState(() => sectionForPath(location.pathname))

  // Persist scroll position across route navigations using a ref
  const navRef       = useRef(null)
  const scrollPos    = useRef(0)
  const sectionRefs  = useRef({})

  // Save scroll before navigation, restore after
  const saveScroll   = useCallback(() => {
    if (navRef.current) scrollPos.current = navRef.current.scrollTop
  }, [])

  // Restore scroll after the component re-renders due to route change
  useEffect(() => {
    if (navRef.current) navRef.current.scrollTop = scrollPos.current
  }, [location.pathname])

  useEffect(() => {
    const activeSection = sectionForPath(location.pathname)
    if (location.pathname.startsWith('/admin/fees/') ||
        location.pathname.startsWith('/admin/library/') ||
        location.pathname.startsWith('/admin/transport') ||
        location.pathname.startsWith('/admin/lms')) {
      setOpenSection(activeSection)
    }
  }, [location.pathname])

  let currentSection = null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center gap-3 h-14 border-b border-white/10 shrink-0 ${exp ? 'px-4' : 'justify-center px-2'}`}>
        <div className="bg-white rounded-lg p-1 shrink-0">
          <img src={LOGO} alt="Kidland" className="h-6 w-auto object-contain"/>
        </div>
        <AnimatePresence>
          {exp && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
              <div className="font-bold text-white text-sm truncate">Kidland School</div>
              <div className="text-primary-300 text-[10px] uppercase tracking-widest">Admin Panel</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable nav — ref prevents scroll reset on re-render */}
      <nav
        ref={navRef}
        className="flex-1 py-3 px-2 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        {NAV.filter(n => (
          (!n.superOnly || isSuperAdmin) &&
          (n.to === '/admin' || !n.to || can(n.permission || moduleForAdminPath(n.to)))
        )).map((n, i) => {
          // Section header divider
          if (n.header) {
            currentSection = n.header
            return exp ? (
              <button
                key={`hdr-${i}`}
                type="button"
                ref={el => { sectionRefs.current[n.header] = el }}
                onClick={() => {
                  saveScroll()
                  setOpenSection(current => {
                    const next = current === n.header ? null : n.header
                    requestAnimationFrame(() => {
                      sectionRefs.current[n.header]?.scrollIntoView({ block: 'nearest' })
                    })
                    return next
                  })
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mt-3 mb-1 rounded-xl text-left transition-colors
                  ${openSection === n.header
                    ? 'bg-primary-400/20 text-primary-300'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <n.icon size={14} className="shrink-0"/>
                <span className="flex-1 text-xs font-semibold truncate">{n.header}</span>
                <FaChevronRight size={10} className={`shrink-0 transition-transform ${openSection === n.header ? 'rotate-90' : ''}`}/>
              </button>
            ) : (
              <button
                key={`hdr-${i}`}
                type="button"
                ref={el => { sectionRefs.current[n.header] = el }}
                onClick={() => {
                  saveScroll()
                  setOpenSection(current => current === n.header ? null : n.header)
                }}
                title={n.header}
                className={`my-2 mx-1 w-[calc(100%-0.5rem)] h-8 rounded-lg flex items-center justify-center transition-colors
                  ${openSection === n.header ? 'bg-primary-400/20 text-primary-300' : 'text-gray-500 hover:bg-white/10 hover:text-white'}`}>
                <n.icon size={13}/>
              </button>
            )
          }

          if (currentSection && openSection !== currentSection) return null

          // NavLink — React Router client-side navigation, NO page reload
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={!!n.end}
              title={!exp ? n.label : undefined}
              onClick={() => {
                saveScroll()
                if (mobile && onMobileClose) onMobileClose()
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5
                ${exp ? 'px-3' : 'justify-center px-2'}
                ${isActive
                  ? 'bg-primary-400/25 text-primary-300 border-l-2 border-primary-400'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`
              }>
              <n.icon size={14} className="shrink-0"/>
              {exp && <span className="truncate whitespace-nowrap">{n.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom user strip */}
      <div className={`border-t border-white/10 shrink-0 ${exp ? 'p-3' : 'p-2'}`}>
        {exp ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name || 'Admin'}</div>
              <div className="text-primary-300 text-[10px] capitalize">{user?.role || 'admin'}</div>
            </div>
            <button onClick={onLogout} title="Logout"
              className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0">
              <FaSignOutAlt size={14}/>
            </button>
          </div>
        ) : (
          <button onClick={onLogout} title="Logout"
            className="w-full flex justify-center text-gray-500 hover:text-red-400 transition-colors p-2">
            <FaSignOutAlt size={15}/>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Profile Dropdown ──────────────────────────────────────────────────────────
function ProfileDropdown() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [open,      setOpen]      = useState(false)
  const [nameModal, setNameModal] = useState(false)
  const [pwModal,   setPwModal]   = useState(false)
  const [newName,   setNewName]   = useState('')
  const [curPw,     setCurPw]     = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confPw,    setConfPw]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const photoRef = useRef(null)
  const dropRef  = useRef(null)

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const avatar   = user?.avatar
  const initials = (user?.name || 'A').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
  const roleLabel = user?.role === 'superadmin' ? 'Super Admin' : 'Co Admin'

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Image files only'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB for profile photo'); return }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const avatarData = ev.target.result
      updateUser({ avatar: avatarData })
      try { await api.put('/users/profile/me', { avatar: avatarData }) } catch {}
      toast.success('Profile photo updated')
    }
    reader.readAsDataURL(file)
  }

  const saveName = async () => {
    if (!newName.trim()) return toast.error('Name cannot be empty')
    setSaving(true)
    try {
      await api.put('/users/profile/me', { name: newName.trim() })
      updateUser({ name: newName.trim() })
      toast.success('Name updated')
      setNameModal(false); setNewName('')
    } catch (err) { toast.error(err?.message || 'Failed to update name') }
    finally { setSaving(false) }
  }

  const savePw = async () => {
    if (!curPw || !newPw || !confPw) return toast.error('All fields are required')
    if (newPw.length < 8) return toast.error('New password must be at least 8 characters')
    if (newPw !== confPw) return toast.error('Passwords do not match')
    setSaving(true)
    try {
      await api.put('/auth/change-password', { currentPassword: curPw, newPassword: newPw })
      toast.success('Password changed successfully')
      setPwModal(false); setCurPw(''); setNewPw(''); setConfPw('')
    } catch (err) { toast.error(err?.message || 'Failed to change password') }
    finally { setSaving(false) }
  }

  const handleLogout = () => { setOpen(false); logout(); navigate('/admin/login') }

  return (
    <>
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none">
          {avatar ? (
            <img src={avatar} alt="profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-400 shadow"/>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-xs shadow">
              {initials}
            </div>
          )}
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-gray-800 dark:text-white leading-tight max-w-[100px] truncate">{user?.name || 'Admin'}</div>
            <div className="text-[10px] text-gray-400 leading-tight">{roleLabel}</div>
          </div>
          <svg className={`w-3 h-3 text-gray-400 hidden md:block transition-transform duration-200 ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.13 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">

              {/* Green header */}
              <div className="p-5 flex flex-col items-center gap-3" style={{ background: 'linear-gradient(135deg,#0f6e0d,#54B435)' }}>
                <div className="relative">
                  {avatar ? (
                    <img src={avatar} alt="profile" className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30 shadow-lg"/>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-2xl ring-4 ring-white/30 shadow-lg">
                      {initials}
                    </div>
                  )}
                  <button onClick={() => photoRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform" title="Change photo">
                    <FaCamera size={11} className="text-primary-600"/>
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-sm leading-tight">{user?.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">{user?.email}</div>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-white text-[10px] font-semibold tracking-wide">
                    <FaShieldAlt size={8}/> {roleLabel}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => { setNewName(user?.name || ''); setNameModal(true); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <FaEdit size={12} className="text-blue-500"/>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Change Name</div>
                    <div className="text-[11px] text-gray-400">Update your display name</div>
                  </div>
                </button>

                <button
                  onClick={() => { setPwModal(true); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                    <FaKey size={12} className="text-amber-500"/>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Change Password</div>
                    <div className="text-[11px] text-gray-400">Update your login password</div>
                  </div>
                </button>

                <div className="mx-1 my-1 border-t border-gray-100 dark:border-gray-800"/>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                    <FaSignOutAlt size={12} className="text-red-500"/>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Logout</div>
                    <div className="text-[11px] text-red-400">Sign out of admin panel</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Change Name Modal */}
      <AnimatePresence>
        {nameModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <FaUser size={14} className="text-blue-500"/>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Change Display Name</h3>
                  <p className="text-xs text-gray-400">Shown across the admin panel</p>
                </div>
                <button onClick={() => { setNameModal(false); setNewName('') }} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <FaTimes size={14}/>
                </button>
              </div>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                className="field mb-4" placeholder="Your full name" autoFocus/>
              <div className="flex gap-3">
                <button onClick={() => { setNameModal(false); setNewName('') }} className="btn-ghost flex-1">Cancel</button>
                <button onClick={saveName} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><FaCheck size={11}/> Save Name</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {pwModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <FaKey size={14} className="text-amber-500"/>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Change Password</h3>
                  <p className="text-xs text-gray-400">Minimum 8 characters required</p>
                </div>
                <button onClick={() => { setPwModal(false); setCurPw(''); setNewPw(''); setConfPw('') }} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <FaTimes size={14}/>
                </button>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className="field" placeholder="Enter current password" autoFocus/>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="field" placeholder="Min 8 characters"/>
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} className="field" placeholder="Repeat new password"
                    onKeyDown={e => e.key === 'Enter' && savePw()}/>
                </div>
              </div>
              {newPw && confPw && newPw !== confPw && (
                <p className="text-xs text-red-500 mb-3">Passwords do not match</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setPwModal(false); setCurPw(''); setNewPw(''); setConfPw('') }} className="btn-ghost flex-1">Cancel</button>
                <button onClick={savePw} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><FaKey size={11}/> Update Password</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  // Persist collapsed state in localStorage so it survives navigation
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('ks-sidebar-collapsed') === 'true' } catch { return false }
  })
  const [hoverExpand,  setHoverExpand]  = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)

  const { user, logout, isSuperAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const navigate    = useNavigate()
  const hoverTimer  = useRef(null)
  const currentModule = moduleForAdminPath(location.pathname)
  if (currentModule && !canAccess(user, currentModule, 'view')) return <Navigate to="/admin" replace />

  // Persist collapsed state
  const toggleCollapsed = useCallback(() => {
    setCollapsed(c => {
      const next = !c
      try { localStorage.setItem('ks-sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }, [])

  const handleLogout = useCallback(() => { logout(); navigate('/admin/login') }, [logout, navigate])

  // Claude-style: hovering the icon-rail temporarily expands sidebar
  const onMouseEnter = useCallback(() => {
    if (collapsed) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = setTimeout(() => setHoverExpand(true), 120)
    }
  }, [collapsed])

  const onMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current)
    setHoverExpand(false)
  }, [])

  // Close mobile sidebar when ESC is pressed
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const desktopExpanded = !collapsed || hoverExpand

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 overflow-hidden">

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="hidden lg:flex flex-col shrink-0 transition-[width] duration-200 ease-in-out relative z-30"
        style={{
          width:      desktopExpanded ? EW : CW,
          background: '#0a1628',
          minHeight:  '100vh',
          // Overlay on top when hover-expanding (so layout doesn't shift)
          position:   collapsed && hoverExpand ? 'absolute' : 'relative',
          boxShadow:  collapsed && hoverExpand ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
        }}>

        {/* Collapse/expand toggle button — only shown in expanded state */}
        {desktopExpanded && (
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-[70px] z-10 w-6 h-6 rounded-full bg-gray-700 hover:bg-primary-500 border-2 border-[#0a1628] flex items-center justify-center text-white transition-colors shadow-lg"
            title={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}>
            {collapsed ? <FaChevronRight size={8}/> : <FaChevronLeft size={8}/>}
          </button>
        )}

        {/* SidebarNav is defined OUTSIDE AdminLayout — never remounted on re-render */}
        <SidebarNav
          exp={desktopExpanded}
          mobile={false}
          isSuperAdmin={isSuperAdmin}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Spacer so content doesn't jump when sidebar overlays on hover-expand */}
      {collapsed && <div className="hidden lg:block shrink-0" style={{ width: CW }}/>}

      {/* ── Mobile Overlay Sidebar ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}/>
            <motion.div
              initial={{ x: -EW }} animate={{ x: 0 }} exit={{ x: -EW }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col"
              style={{ width: EW, background: '#0a1628' }}>
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <FaTimes size={13}/>
              </button>
              <SidebarNav
                exp
                mobile
                isSuperAdmin={isSuperAdmin}
                user={user}
                onLogout={handleLogout}
                onMobileClose={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <FaBars size={16}/>
            </button>
            <div>
              <div className="text-sm font-bold text-gray-800 dark:text-white">Admin Dashboard</div>
              <div className="text-xs text-gray-400 hidden sm:block">Kidland School Management</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FaExternalLinkAlt size={10}/> View Site
            </Link>
            <button onClick={toggle}
              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-all">
              {dark ? <FaSun size={14}/> : <FaMoon size={14}/>}
            </button>
            <NotificationBell/>
            <ProfileDropdown/>
          </div>
        </header>

        {/* Page content — only this area changes on navigation */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
