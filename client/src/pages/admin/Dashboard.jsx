import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  FaUserGraduate, FaNewspaper, FaCalendarAlt, FaBell, FaUsers, FaImages,
  FaClock, FaCheckCircle, FaHourglass, FaTimesCircle, FaInbox,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useAdmissions, useNews, useEvents, useNotices, useGallery } from '../../hooks/useApi'
import StudentEnrollmentCard from '../../components/admin/StudentEnrollmentCard'

const STATUS_COLORS = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' }
const STATUS_ICON   = { pending: FaHourglass, approved: FaCheckCircle, rejected: FaTimesCircle }

// Builds the last 6 calendar months as labels, e.g. ['Jan','Feb',...] ending at current month
function lastSixMonths() {
  const out = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }) })
  }
  return out
}

export default function Dashboard() {
  const { user } = useAuth()
  const { studentsByGrade } = useSettings()

  const gradeChartData = useMemo(() =>
    (studentsByGrade || []).map(g => ({
      grade: g.grade
        .replace('Nursery','Nur')
        .replace('Grade ','G')
        .replace('LKG','LKG')
        .replace('UKG','UKG'),
      boys: Number(g.boys)||0,
      girls: Number(g.girls)||0,
      fullGrade: g.grade,
    })),
    [studentsByGrade]
  )

  const { data: admData,    loading: admLoading }    = useAdmissions({ limit: 200 })
  const { data: newsData }   = useNews({ limit: 1, status: undefined })
  const { data: eventsData } = useEvents({ limit: 1, status: undefined })
  const { data: noticesData }= useNotices({ limit: 1, status: undefined })
  const { data: galleryData }= useGallery({ limit: 1 })

  const admissions = admData?.data || []

  // ── Real status breakdown ──
  const statusCounts = useMemo(() => ({
    pending:  admissions.filter(a => a.status === 'pending').length,
    approved: admissions.filter(a => a.status === 'approved').length,
    rejected: admissions.filter(a => a.status === 'rejected').length,
  }), [admissions])

  const statusData = [
    { name: 'Approved', value: statusCounts.approved, color: '#54B435' },
    { name: 'Pending',  value: statusCounts.pending,  color: '#FBBF24' },
    { name: 'Rejected', value: statusCounts.rejected, color: '#EF4444' },
  ]
  const hasStatusData = statusData.some(s => s.value > 0)

  // ── Recent applications (real, most recent 5) ──
  const recentApps = useMemo(() => {
    return [...admissions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  }, [admissions])

  const STATS = [
    { icon: FaUsers,       label: 'Applications', value: admissions.length,           link: '/admin/admissions', color: 'bg-blue-50 dark:bg-blue-900/20',   ic: 'text-blue-500' },
    { icon: FaCalendarAlt, label: 'Events',       value: eventsData?.total ?? '—',    link: '/admin/events',     color: 'bg-yellow-50 dark:bg-yellow-900/20',ic: 'text-yellow-500' },
    { icon: FaNewspaper,   label: 'Articles',     value: newsData?.total ?? '—',      link: '/admin/news',       color: 'bg-purple-50 dark:bg-purple-900/20',ic: 'text-purple-500' },
    { icon: FaBell,        label: 'Notices',      value: noticesData?.total ?? '—',   link: '/admin/notices',    color: 'bg-red-50 dark:bg-red-900/20',     ic: 'text-red-500' },
    { icon: FaImages,      label: 'Gallery',      value: galleryData?.total ?? '—',   link: '/admin/gallery',    color: 'bg-pink-50 dark:bg-pink-900/20',   ic: 'text-pink-500' },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Welcome back, <span className="font-semibold text-primary-500">{user?.name || 'Admin'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
          <FaClock size={11} className="text-primary-400" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stat cards — Total Students CRUD card + real counts from backend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StudentEnrollmentCard />
        {STATS.map((s, i) => (
          <Link to={s.link} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.06 }}
              className="card p-4 hover:shadow-md transition-shadow h-full">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className={`text-lg ${s.ic}`} />
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <div className="lg:col-span-2 card p-5 md:p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Students by Grade</h3>
          <p className="text-xs text-gray-400 mb-4">Current enrollment — boys vs girls per grade. Edit counts from the Total Students card above.</p>
          {gradeChartData.every(g => g.boys === 0 && g.girls === 0) ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <FaInbox size={28} className="opacity-40" />
              <p className="text-sm">No student counts entered yet — click "Edit Counts" above to get started</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={gradeChartData} barSize={12} barGap={2} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="grade"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={55}
                />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }}
                  formatter={(val, name, props) => [val, name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullGrade || label}
                />
                <Bar dataKey="boys"  fill="#60a5fa" radius={[4, 4, 0, 0]} name="Boys"  />
                <Bar dataKey="girls" fill="#f472b6" radius={[4, 4, 0, 0]} name="Girls" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 md:p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Application Status</h3>
          <p className="text-xs text-gray-400 mb-3">All-time breakdown</p>
          {hasStatusData ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{s.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[140px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <FaInbox size={24} className="opacity-40" />
              <p className="text-xs">No applications yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent applications + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Applications</h3>
            <Link to="/admin/admissions" className="text-xs text-primary-500 hover:underline font-semibold">View All</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentApps.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No applications submitted yet</div>
            ) : recentApps.map((a, i) => {
              const Icon = STATUS_ICON[a.status] || FaHourglass
              return (
                <div key={a._id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">
                      {(a.studentName || a.name || 'S')[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.studentName || a.name}</div>
                      <div className="text-xs text-gray-400">{a.classApplying || a.grade} · {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[a.status] || 'badge-gray'} flex items-center gap-1`}>
                    <Icon size={9} />{a.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Quick Links</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { to: '/admin/news',       label: 'New Article',   icon: FaNewspaper,   color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
              { to: '/admin/events',     label: 'New Event',     icon: FaCalendarAlt, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
              { to: '/admin/notices',    label: 'New Notice',    icon: FaBell,        color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
              { to: '/admin/gallery',    label: 'Add Photo',     icon: FaImages,      color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
              { to: '/admin/teachers',   label: 'Add Teacher',   icon: FaUserGraduate,color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
              { to: '/admin/admissions', label: 'View Admissions',icon: FaUsers,      color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
            ].map(q => (
              <Link key={q.to} to={q.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-all">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${q.color}`}>
                  <q.icon size={14} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
