import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaCalendar, FaMapMarkerAlt, FaClock, FaFilter, FaTrophy,
  FaFlask, FaMusic, FaMicrophone, FaLeaf, FaTimes, FaTag
} from 'react-icons/fa'
import { PageHero, SectionHeader, ScrollTop, EmptyState } from '../../components/ui/index'
import { useEvents } from '../../hooks/useApi'

const FALLBACK = [
  { _id:'1', title:'Annual Sports Day 2025', date:'June 5, 2025', time:'7:00 AM – 5:00 PM', venue:'School Ground', cat:'Sports', Icon:FaTrophy,
    desc:'A full-day house competition featuring athletic events, relay races, tug of war, and team sports. Parents and guardians are warmly invited to cheer for their children. Refreshments will be provided.' },
  { _id:'2', title:'Science and Innovation Fair', date:'June 20, 2025', time:'9:00 AM – 4:00 PM', venue:'Auditorium', cat:'Academic', Icon:FaFlask,
    desc:'Students from Grades 6–10 showcase their science projects and innovations. Judges from leading institutions will evaluate the entries. Prizes will be awarded for the top three projects in each category.' },
  { _id:'3', title:'Annual Cultural Programme', date:'July 15, 2025', time:'10:00 AM – 6:00 PM', venue:'School Ground', cat:'Cultural', Icon:FaMusic,
    desc:'A grand celebration featuring traditional folk dances, music performances, drama productions and a cultural dress competition. Students from all classes will participate in this vibrant showcase of Nepali heritage.' },
  { _id:'4', title:'Inter-School Debate Championship', date:'August 10, 2025', time:'11:00 AM – 5:00 PM', venue:'Conference Hall', cat:'Academic', Icon:FaMicrophone,
    desc:'Kidland School hosts the annual inter-school debate championship with participants from 10+ schools across Lalitpur. Topics will be announced one week prior. Both English and Nepali debate rounds are scheduled.' },
  { _id:'5', title:'World Child Day Celebration', date:'November 20, 2025', time:'10:00 AM – 2:00 PM', venue:'School Ground', cat:'Cultural', Icon:FaLeaf,
    desc:'A special programme celebrating children\'s rights and creativity. Activities include artwork exhibition, poetry recitation and a special presentation by the student council on the importance of education.' },
  { _id:'6', title:'Graduation Ceremony 2025', date:'December 15, 2025', time:'9:00 AM – 12:00 PM', venue:'Auditorium', cat:'Academic', Icon:FaTrophy,
    desc:'The annual graduation and prize distribution ceremony honours SEE completers and outstanding students of the academic year. Parents, teachers and distinguished guests are cordially invited to attend this memorable event.' },
]

const CATS = ['All', 'Academic', 'Cultural', 'Sports', 'Social', 'Other']
const CAT_BADGE  = { Academic:'badge-blue', Cultural:'badge-yellow', Sports:'badge-green', Social:'badge-gray', Other:'badge-gray', General:'badge-gray' }
const CAT_BG     = { Academic:'bg-blue-50 dark:bg-blue-900/20', Cultural:'bg-amber-50 dark:bg-amber-900/20', Sports:'bg-green-50 dark:bg-green-900/20' }
const CAT_ICON   = { Academic:'text-blue-500', Cultural:'text-amber-500', Sports:'text-green-500' }

/* ── Category icon map ── */
const CAT_ICON_COMPONENT = { Sports:FaTrophy, Academic:FaFlask, Cultural:FaMusic, Social:FaMicrophone, Other:FaLeaf }

/* ── Full-detail modal ── */
function EventModal({ event, onClose }) {
  if (!event) return null
  const desc = event.desc || event.description || ''
  const EIcon = event.Icon || CAT_ICON_COMPONENT[event.cat] || FaCalendar
  const catBg = CAT_BG[event.cat] || 'bg-gray-50 dark:bg-gray-800'
  const catIcCls = CAT_ICON[event.cat] || 'text-primary-500'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* top banner */}
        <div className={`${catBg} px-6 pt-6 pb-4 flex items-start gap-4`}>
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow flex items-center justify-center shrink-0">
            <EIcon className={catIcCls} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`badge ${CAT_BADGE[event.cat] || 'badge-gray'} mb-2`}>{event.cat || 'General'}</span>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-snug">{event.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/70 dark:bg-gray-700/70 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shrink-0">
            <FaTimes size={14} />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-5">
          {/* description */}
          {desc ? (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">About this Event</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">No description provided.</p>
          )}

          {/* details grid */}
          <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {event.date && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <FaCalendar className="text-primary-500" size={13} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{event.date}</p>
                </div>
              </div>
            )}
            {event.time && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <FaClock className="text-primary-500" size={13} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Time</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{event.time}</p>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt className="text-primary-500" size={13} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Venue</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{event.venue}</p>
                </div>
              </div>
            )}
            {event.cat && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <FaTag className="text-primary-500" size={13} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Category</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{event.cat}</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={onClose} className="w-full btn-primary justify-center py-2.5 mt-2">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function EventsPage() {
  const [cat, setCat]           = useState('All')
  const [selected, setSelected] = useState(null)
  const { data, loading }       = useEvents()


  const raw   = data?.data?.length ? data.data : FALLBACK
  const items = cat === 'All' ? raw : raw.filter(e => e.cat === cat)

  return (
    <>
      <PageHero
        tag="Events"
        title="School Events"
        sub="Upcoming events, competitions and celebrations that make school life vibrant."
        breadcrumbs={[{ label: 'Events' }]}
      />

      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">

          {/* Header + filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-10">
            <SectionHeader tag="Calendar" title="Upcoming Events" center={false} />
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <FaFilter className="text-gray-400" size={13} />
              {CATS.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    c === cat
                      ? 'bg-primary-400 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="card p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/3"/>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"/>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"/>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"/>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No events found" sub="Check back soon for upcoming school events." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {items.map((e, i) => {
                const EIcon = e.Icon || CAT_ICON_COMPONENT[e.cat] || FaCalendar
                const desc  = e.desc || e.description || ''
                const catBg = CAT_BG[e.cat] || 'bg-gray-50 dark:bg-gray-800'
                const catIcCls = CAT_ICON[e.cat] || 'text-primary-500'
                return (
                  <motion.div
                    key={e._id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="card overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
                  >
                    {/* Coloured top strip */}
                    <div className={`${catBg} px-5 pt-5 pb-4 border-l-4 border-primary-400`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`badge ${CAT_BADGE[e.cat] || 'badge-gray'}`}>{e.cat || 'General'}</span>
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center shrink-0">
                          <EIcon className={catIcCls} size={17} />
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm md:text-base leading-snug">
                        {e.title}
                      </h3>
                    </div>

                    {/* Description — fully visible, no clamp */}
                    <div className="px-5 py-4 flex-1 flex flex-col">
                      {desc ? (
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
                          {desc.length > 180 ? (
                            <>
                              {desc.slice(0, 180)}&hellip;{' '}
                              <button
                                onClick={() => setSelected(e)}
                                className="text-primary-500 hover:text-primary-600 font-semibold text-xs"
                              >
                                Read more
                              </button>
                            </>
                          ) : desc}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic flex-1">No description provided.</p>
                      )}

                      {/* Event details */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                        {e.date  && <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><FaCalendar className="text-primary-400 shrink-0" size={11}/><span>{e.date}</span></div>}
                        {e.time  && <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><FaClock className="text-primary-400 shrink-0" size={11}/><span>{e.time}</span></div>}
                        {e.venue && <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><FaMapMarkerAlt className="text-primary-400 shrink-0" size={11}/><span>{e.venue}</span></div>}
                      </div>

                      {/* View details button */}
                      <button
                        onClick={() => setSelected(e)}
                        className="mt-4 w-full py-2 rounded-xl border-2 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 text-xs font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        View Full Details
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <EventModal event={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <ScrollTop />
    </>
  )
}
