import { Link } from 'react-router-dom'
import {
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock,
  FaFacebook, FaInstagram, FaWhatsapp, FaYoutube, FaArrowRight,
} from 'react-icons/fa'
import LOGO from '../../assets/logo.js'
import { useSettings } from '../../context/SettingsContext'

export default function Footer() {
  const yr = new Date().getFullYear()
  const { settings } = useSettings()
  const s = settings || {}
  const phone1      = s.phone1      || '9841404920'
  const phone2      = s.phone2      || '01-5430237'
  const email1      = s.email1      || 'kidlandmontessori@gmail.com'
  const address     = s.address     || 'Kusunti, Lalitpur-13, Nepal'
  const hour     = s.hour     || 'Mon – Fri: 10:00 AM – 4:00 PM'
  const fb          = s.fb          || 'https://facebook.com/kidlandmontessori'
  const ig          = s.ig          || 'https://instagram.com/kidlandeducation'
  const wa          = (s.wa         || '9779841404920').replace(/\D/g, '')
  const noticeTexts  = s.noticeText  || ''
  const slogan   = s.slogan || 'Duty, Honor, Country'
  const name        = s.name        || 'kidland school'

  return (
    <footer>
      <div style={{ background: 'linear-gradient(180deg, #0f2d06 0%, #173a0d 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 items-start">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-3 mb-5">
                <img src={LOGO} alt={name} className="h-50 w-auto object-contain"/>

              </Link>
              <p className="text-white/80 text-sm leading-relaxed max-w-sm mb-5">
                {slogan}
              </p>
              {/* <div className="space-y-2.5 mb-5">
                {[
                  [FaMapMarkerAlt, address],
                  [FaPhoneAlt,    `${phone2}  /  ${phone1}`],
                  [FaEnvelope,    email1],
                  [FaClock,       hour],
                ].map(([Icon, text], i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Icon size={13} className="shrink-0 mt-0.5" style={{ color: '#86ef67' }}/>
                    <span>{text}</span>
                  </div>
                ))}
              </div> */}
              <div className="flex gap-2">
                {[
                  [fb,  FaFacebook,  'hover:bg-white/15'],
                  [ig,  FaInstagram, 'hover:bg-white/15'],
                  ['https://youtube.com', FaYoutube, 'hover:bg-white/15'],
                  [`https://api.whatsapp.com/send?phone=${wa}`, FaWhatsapp, 'hover:bg-white/15'],
                ].map(([href, Icon, hov], i) => (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-lg bg-white/10 ${hov} flex items-center justify-center transition-colors text-white`}>
                    <Icon size={14}/>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-white text-lg mb-5">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  ['/', 'Home'],
                  ['/about', 'About Us'],
                  ['/academics', 'Academic Programs'],
                  ['/admission', 'Admission'],
                  ['/gallery', 'Gallery'],
                  ['/contact', 'Contact'],
                ].map(([to, label]) => (
                  <li key={label}>
                    <Link to={to} className="text-white/75 hover:text-white text-sm transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#86ef67] shrink-0"/>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-black text-white text-lg mb-5">Resources</h4>
              <ul className="space-y-2.5">
                {[
                  ['/notices', 'Notices'],
                  ['/downloads', 'Downloads'],
                  ['/events',  'Events'],
                  ['/news',    'News'],
                  ['/career',  'Career'],
                  ['/alumni',  'Testimonials'],
                  ['/teachers','Faculty'],
                ].map(([to, p]) => (
                  <li key={p}>
                    <Link to={to} className="text-white/75 hover:text-white text-sm transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#86ef67] shrink-0"/>
                      {p}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-black text-white text-lg mb-5">Contact Info</h4>
              <ul className="space-y-3 mb-6">
                {[
                  [FaMapMarkerAlt, address],
                  [FaPhoneAlt,   `${phone2}  /  ${phone1}`],
                  // [FaPhoneAlt,    phone1],
                  [FaEnvelope,    email1],
                  [FaClock,  hour],
                ].map(([Icon, txt], i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Icon size={13} className="shrink-0 mt-0.5" style={{ color: '#86ef67' }}/>
                    <span>{txt}</span>
                  </li>
                ))}
                
              </ul>
              <Link to="/apply"
                className="w-full flex items-center justify-center gap-2 font-bold text-white py-3 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: '#54B435', fontSize: 14, boxShadow: '0 4px 14px rgba(84,180,53,0.35)' }}>
                Apply Now <FaArrowRight size={12}/>
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-4">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/45">
            <span>© {yr} {name}. All rights reserved.</span>
            <span>Developed by dipesh</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
