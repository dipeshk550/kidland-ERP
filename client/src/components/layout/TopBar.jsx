import { useState, useEffect } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { convertToBS } from 'nepali-date-converter/dist/lib/nepali-date-helper'
import {
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock,
  FaFacebook, FaInstagram, FaYoutube, FaWhatsapp,
  FaCalendarAlt,
} from 'react-icons/fa'

const NEPALI_DAYS = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार']
const NEPALI_MONTHS = ['बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र']

function getKathmanduDateParts(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  }
}

/* ── Tiny live clock component ── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now)

  const kathmanduParts = getKathmanduDateParts(now)
  const kathmanduNoon = new Date(kathmanduParts.year, kathmanduParts.month - 1, kathmanduParts.day, 12, 0, 0)
  const bsDate = convertToBS(kathmanduNoon).BS
  const day = NEPALI_DAYS[bsDate.day]

  return (
    <span className="flex items-center gap-1.5 text-white/85">
      <FaCalendarAlt size={10}/>
      <span>{day}, {String(bsDate.date).padStart(2, '0')} {NEPALI_MONTHS[bsDate.month]} {bsDate.year} B.S. &nbsp;•&nbsp;
         {time}</span>
    </span>
  )
}

export default function TopBar() {
  const { settings } = useSettings()
  const s = settings || {}
  const phone1 = s.phone1  || '9841404920'
  const phone2 = s.phone2  || '01-5430237'
  const email1 = s.email1  || 'kidlandmontessori@gmail.com'
  const address = s.address || 'Kusunti, Lalitpur, Nepal'
  const fb      = s.fb      || 'https://facebook.com/kidlandmontessori'
  const ig      = s.ig      || 'https://instagram.com/kidlandeducation'
  const wa      = (s.wa     || '9779841404920').replace(/\D/g, '')

  return (
    /* ── Contact / info bar — dark navy (same as Nirvana dark top bar) ── */
    <div className="hidden md:block" style={{ background: '#54B435' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-9 text-xs">

        {/* Left: phones + email + address */}
        <div className="flex items-center gap-5 text-white/85 divide-x divide-white/20">
          <span className="flex items-center gap-1.5 pr-5">
            <FaPhoneAlt size={10} style={{ color: '#fff' }}/>
            {phone2} / {phone1}
          </span>
          {/* <span className="flex items-center gap-1.5 px-5">
            <FaPhoneAlt size={10} style={{ color: '#fff' }}/>{phone1}
          </span> */}
          <span className="hidden lg:flex items-center gap-1.5 px-5">
            <FaEnvelope size={10} style={{ color: '#fff' }}/>{email1}
          </span>
          <span className="hidden xl:flex items-center gap-1.5 pl-5">
            <FaMapMarkerAlt size={10} style={{ color: '#fff' }}/>{address}
          </span>
        </div>

        {/* Right: clock + socials */}
        <div className="flex items-center gap-4 text-white/85">
          <LiveClock/>
          <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-white/20">
            {[
              [fb,  FaFacebook,  'hover:bg-white/20'],
              [ig,  FaInstagram, 'hover:bg-white/20'],
              [`https://api.whatsapp.com/send?phone=${wa}`, FaWhatsapp, 'hover:bg-white/20'],
              ['https://youtube.com', FaYoutube, 'hover:bg-white/20'],
            ].map(([href, Icon, hov], i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                className={`w-6 h-6 rounded-full bg-white/12 ${hov} flex items-center justify-center transition-colors`}>
                <Icon size={11} className="text-white"/>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
