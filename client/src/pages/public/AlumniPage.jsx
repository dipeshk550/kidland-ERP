import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGraduationCap, FaBriefcase, FaStar, FaUsers } from 'react-icons/fa'
import { PageHero, ScrollTop, Spinner } from '../../components/ui/index'
import { useAlumni } from '../../hooks/useApi'

const STATS = [
  { icon: FaGraduationCap, value: '500+', label: 'Alumni Network' },
  { icon: FaStar,          value: '95%',  label: 'SEE Pass Rate'  },
  { icon: FaUsers,         value: '20+',  label: 'Years of Legacy'},
]

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function AlumniPage() {
  // No fallback dummy data — start empty, show real data only once loaded
  const { data, loading } = useAlumni({ limit: 500 })
  const alumni = data?.data || []

  // Derive unique batches from real data only
  const batches = useMemo(() => {
    const set = new Set(alumni.map(a => a.batch).filter(Boolean))
    return [...set].sort((a, b) => Number(b) - Number(a))
  }, [alumni])

  const [activeBatch, setActiveBatch] = useState(null)

  // When batch changes, show ONLY that batch's students
  const batchStudents = useMemo(() => {
    if (!activeBatch) return []
    return alumni.filter(a => a.batch === activeBatch)
  }, [alumni, activeBatch])

  const handleBatch = (b) => {
    setActiveBatch(prev => prev === b ? null : b)
  }

  return (
    <>
      <PageHero
        tag="Our Alumni"
        title="Alumni and Success Stories"
        sub="Proud graduates of Kidland School carrying forward the values of Duty, Honor and Country into their careers and lives."
        breadcrumbs={[{ label: 'Alumni' }]}
      />

      {/* Stats */}
      <section className="py-10 bg-primary-50 border-b border-primary-100">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {STATS.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <s.icon className="text-primary-500 text-2xl mx-auto mb-2"/>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Batch selector */}
      <section className="py-14 bg-primary-50/40">
        <div className="wrap px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-black tracking-[0.25em] uppercase text-primary-500 mb-2">Browse by Year</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">SEE Batch</h2>
          <div className="w-10 h-1 rounded-full bg-primary-400 mx-auto mb-4"/>
          <p className="text-gray-500 text-sm mb-8">
            Select a batch to view our graduates from that year.
          </p>

          {loading ? (
            <div className="flex justify-center py-6"><Spinner/></div>
          ) : batches.length === 0 ? (
            <p className="text-gray-400 text-sm py-6">No alumni batches added yet. Alumni can be added from the admin dashboard.</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {batches.map(b => (
                <button key={b} onClick={() => handleBatch(b)}
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm"
                  style={{
                    background: activeBatch === b ? '#338016' : '#54B435',
                    color: 'white',
                    transform: activeBatch === b ? 'scale(1.05)' : undefined,
                    boxShadow: activeBatch === b ? '0 4px 16px rgba(84,180,53,0.45)' : undefined,
                  }}>
                  Batch {b} B.S
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Batch students - ONLY shows when a batch is selected */}
      <AnimatePresence>
        {activeBatch && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border-t border-gray-100">
            <div className="wrap px-4 sm:px-6 lg:px-8 py-14">
              <h3 className="text-2xl font-black text-gray-900 mb-8 text-center">
                Batch {activeBatch} B.S — Graduates
              </h3>

              {loading ? (
                <div className="flex justify-center py-10"><Spinner size="lg"/></div>
              ) : batchStudents.length === 0 ? (
                <div className="text-center py-10">
                  <FaGraduationCap className="text-gray-200 text-5xl mx-auto mb-3"/>
                  <p className="text-gray-400">No students added for this batch yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {batchStudents.map((a, i) => (
                    <motion.div key={a._id || i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="text-center group">
                      <div className="aspect-square rounded-2xl overflow-hidden mb-3 shadow-md"
                        style={{ background: '#54B435' }}>
                        {a.photo ? (
                          <img src={a.photo} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                            {initials(a.name)}
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">{a.name}</h4>
                      {a.achievement && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.achievement}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{ background: '#0a1628' }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(rgba(84,180,53,0.4) 1px, transparent 1px)', backgroundSize: '22px 22px' }}/>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Are you a Kidland alumnus?</h3>
              <p className="text-gray-300 mb-6 max-w-lg mx-auto text-sm md:text-base">
                We would love to feature your story and stay connected. Reach out to share your journey since graduating.
              </p>
              <a href="/contact" className="inline-flex items-center gap-2 font-bold text-white rounded-full px-7 py-3 hover:-translate-y-0.5 transition-all"
                style={{ background: '#54B435' }}>
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      <ScrollTop/>
    </>
  )
}
