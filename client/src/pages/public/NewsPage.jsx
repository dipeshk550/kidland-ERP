import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCalendar, FaUser, FaSearch, FaArrowRight, FaTag, FaClock, FaEye } from 'react-icons/fa'
import { PageHero, ScrollTop, Pagination, EmptyState } from '../../components/ui/index'
import { SkeletonGrid } from '../../components/ui/Skeletons'
import { useNews } from '../../hooks/useApi'

const FALLBACK = [
  { _id:'1', title:'Kidland Wins Inter-School Debate 2025', cat:'Achievement', createdAt:'2025-05-15', excerpt:'Our students brought home first place at the Lalitpur debate championship.', img:'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5326-scaled.jpg', views:248 },
  { _id:'2', title:'New Computer Lab Inaugurated',           cat:'Infrastructure', createdAt:'2025-05-10', excerpt:'State-of-the-art lab with 40 workstations and high-speed internet launched.', img:'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5607-scaled.jpg', views:183 },
  { _id:'3', title:'Annual Science Fair 2025 Highlights',   cat:'Academic',       createdAt:'2025-04-28', excerpt:'Students from all grades showcased innovative science projects.', img:'https://kidlandschool.edu.np/wp-content/uploads/2025/08/IMG_2262-1-scaled.jpg', views:312 },
  { _id:'4', title:'Kidland Celebrates World Child Day',    cat:'Event',          createdAt:'2025-04-20', excerpt:'Special activities, artwork and presentations marked the celebration.', img:'https://kidlandschool.edu.np/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-19-at-4.52.21-PM.jpeg', views:89 },
  { _id:'5', title:'SEE Results 2082: Outstanding Achievement', cat:'Achievement', createdAt:'2025-04-10', excerpt:'Average GPA of 3.72 achieved with multiple distinction holders.', img:'https://kidlandschool.edu.np/wp-content/uploads/2025/07/IMG_0893-scaled.jpg', views:412 },
  { _id:'6', title:'Scholarship Programme Open for 2083',   cat:'Admission',      createdAt:'2025-03-25', excerpt:'Merit and need-based scholarships available for new admissions.', img:'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5260-scaled.jpg', views:0 },
]

const CAT_STYLE = {
  Achievement:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Infrastructure: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Academic:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Event:          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  Admission:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  General:        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

const PER = 6

function readingTime(content = '') {
  const words = (content || '').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d || '' }
}

export default function NewsPage() {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const navigate = useNavigate()
  const { data, loading } = useNews()

  const items = data?.data?.length ? data.data : FALLBACK

  const filtered = items.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.excerpt || '').toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice((page - 1) * PER, page * PER)

  const goToArticle = (id) => navigate(`/news/${id}`)

  return (
    <>
      <PageHero
        tag="News & Blog"
        title="Latest News"
        sub="Achievements, events and important announcements from Kidland School."
        breadcrumbs={[{ label: 'News' }]}
      />

      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">All Articles</h2>
              {!loading && (
                <p className="text-sm text-gray-400 mt-0.5">{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</p>
              )}
            </div>
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search articles…"
                className="field pl-9"
              />
            </div>
          </div>

          {loading ? <SkeletonGrid cols={3} count={6} /> : (
            <>
              {paged.length === 0 ? <EmptyState title="No articles found" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {paged.map((n, i) => (
                    <motion.article
                      key={n._id || i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => goToArticle(n._id)}
                      className="card-hover overflow-hidden group cursor-pointer flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {n.img ? (
                          <img
                            src={n.img}
                            alt={n.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => {
                              e.target.parentElement.style.background = 'linear-gradient(135deg,#0f2d06,#1a4a0a)'
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <FaTag size={28} className="text-gray-300 dark:text-gray-700" />
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-4 md:p-5 flex flex-col flex-1">
                        {/* Category + Date */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_STYLE[n.cat || n.category] || CAT_STYLE.General}`}>
                            <FaTag size={8} />{n.cat || n.category || 'General'}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FaCalendar size={9} />{formatDate(n.createdAt || n.date)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 text-sm md:text-base flex-1">
                          {n.title}
                        </h3>

                        {/* Excerpt */}
                        {n.excerpt && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{n.excerpt}</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><FaUser size={9} />Admin</span>
                            {n.content && (
                              <span className="flex items-center gap-1"><FaClock size={9} />{readingTime(n.content)} min</span>
                            )}
                            {n.views > 0 && (
                              <span className="flex items-center gap-1"><FaEye size={9} />{n.views}</span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read More <FaArrowRight size={9} />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
              <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} label="articles" />
            </>
          )}
        </div>
      </section>

      <ScrollTop />
    </>
  )
}
