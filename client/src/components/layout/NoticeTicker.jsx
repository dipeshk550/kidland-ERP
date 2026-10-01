import { Link } from 'react-router-dom'
import { FaBell } from 'react-icons/fa'
import { useNotices } from '../../hooks/useApi'
import { useSettings } from '../../context/SettingsContext'

export default function NoticeTicker() {
  const { data } = useNotices({ limit: 5 })
  const { settings } = useSettings()
  const notices = data?.data || []
  const liveItems = settings?.noticeEnabled !== false ? notices.map(notice => notice.title).filter(Boolean) : []
  const tickerGroups = [liveItems, liveItems]

  return (
    <div className="w-full border-b border-green-100 overflow-hidden" style={{ background: 'linear-gradient(90deg, #e0f5da 0%, #edf9e8 52%, #f6fcf3 100%)' }}>
      <div className="max-w-7xl mx-auto h-10 md:h-11 flex items-stretch px-0 sm:px-0">
        <Link
          to="/notices"
          className="shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-5 rounded-r-2xl font-black text-white text-[10px] sm:text-xs tracking-[0.14em] uppercase transition-all hover:translate-x-0.5"
          style={{ background: 'linear-gradient(135deg,#1f4511 0%, #2e7d17 45%, #54B435 100%)', boxShadow: '0 8px 20px rgba(84,180,53,0.24)' }}>
          <FaBell size={11} />
          NOTICES
        </Link>

        <div className="flex-1 overflow-hidden relative">
          <div className="ticker absolute inset-0 flex items-center min-w-max px-4 sm:px-6 text-[12px] md:text-sm text-[#17330e] font-medium gap-10 md:gap-12">
            {tickerGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-8 md:gap-10 shrink-0 whitespace-nowrap">
                {group.map((notice, index) => (
                  <Link key={`${groupIndex}-${index}-${notice}`} to="/notices" className="flex items-center gap-2.5 whitespace-nowrap hover:text-[#0f2d06] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#54B435] shadow-sm"/>
                    <span className="text-[12px] md:text-sm leading-none">{notice}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}