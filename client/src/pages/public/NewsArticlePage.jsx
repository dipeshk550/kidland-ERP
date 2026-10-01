import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaCalendar, FaTag, FaArrowLeft, FaArrowRight,
  FaFacebook, FaTwitter, FaLink, FaUser, FaClock, FaEye
} from 'react-icons/fa'
import { PageHero, ScrollTop } from '../../components/ui/index'
import api from '../../services/api'

const CAT_COLOR = {
  Achievement:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Infrastructure:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Academic:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Event:         'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Admission:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  General:       'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

function readingTime(content = '') {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return d || '' }
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-72 md:h-[420px] bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8" />
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="space-y-3 pt-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RelatedCard({ item }) {
  return (
    <Link to={`/news/${item._id}`} className="flex gap-3 group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {item.img ? (
          <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FaTag size={16} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">{item.title}</p>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <FaCalendar size={8} />{formatDate(item.createdAt)}
        </p>
      </div>
    </Link>
  )
}

export default function NewsArticlePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle]   = useState(null)
  const [related, setRelated]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setArticle(null)

    api.get(`/news/${id}`)
      .then(res => {
        const art = res?.data ?? res
        if (!art || !art.title) { setNotFound(true); return }
        setArticle(art)
        // Fetch related articles
        return api.get('/news', { params: { status: 'published' } })
      })
      .then(allRes => {
        if (!allRes) return
        const all = allRes?.data ?? allRes
        const items = Array.isArray(all) ? all : (all?.data ?? [])
        setRelated(items.filter(n => n._id !== id).slice(0, 5))
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')
  }
  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article?.title || '')}`, '_blank')
  }

  if (notFound) {
    return (
      <>
        <PageHero tag="News & Blog" title="Article Not Found" breadcrumbs={[{ label: 'News', to: '/news' }, { label: 'Not Found' }]} />
        <div className="py-24 text-center">
          <p className="text-gray-500 mb-6">This article doesn't exist or has been removed.</p>
          <Link to="/news" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors">
            <FaArrowLeft size={13} /> Back to News
          </Link>
        </div>
        <ScrollTop />
      </>
    )
  }

  return (
    <>
      <PageHero
        tag="News & Blog"
        title={loading ? 'Loading…' : (article?.title || 'Article')}
        breadcrumbs={[{ label: 'News', to: '/news' }, { label: loading ? '…' : (article?.title?.slice(0, 40) + (article?.title?.length > 40 ? '…' : '')) }]}
      />

      <section className="py-12 md:py-16 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          {loading ? (
            <ArticleSkeleton />
          ) : (
            <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">

              {/* ── MAIN ARTICLE COLUMN ── */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex-1 min-w-0"
              >
                {/* Featured Image */}
                {article.img && (
                  <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg" style={{ aspectRatio: '16/7' }}>
                    <img
                      src={article.img}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.parentElement.style.background = 'linear-gradient(135deg,#0f2d06,#1a4a0a)'; e.target.style.display = 'none' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Article header */}
                <div className="mb-7">
                  {/* Category badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${CAT_COLOR[article.cat] || CAT_COLOR.General}`}>
                    <FaTag size={9} /> {article.cat || 'General'}
                  </span>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-5">
                    {article.title}
                  </h1>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <span className="flex items-center gap-1.5">
                      <FaUser size={11} /> <span>Admin</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaCalendar size={11} /> <span>{formatDate(article.createdAt)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaClock size={11} /> <span>{readingTime(article.content)} min read</span>
                    </span>
                    {article.views > 0 && (
                      <span className="flex items-center gap-1.5">
                        <FaEye size={11} /> <span>{article.views.toLocaleString()} views</span>
                      </span>
                    )}

                    {/* Share buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-gray-400 hidden sm:block">Share:</span>
                      <button
                        onClick={shareOnFacebook}
                        className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Share on Facebook"
                      >
                        <FaFacebook size={13} />
                      </button>
                      <button
                        onClick={shareOnTwitter}
                        className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                        title="Share on Twitter"
                      >
                        <FaTwitter size={13} />
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Copy link"
                      >
                        <FaLink size={12} />
                      </button>
                      {copied && <span className="text-xs text-green-600 font-semibold">Copied!</span>}
                    </div>
                  </div>
                </div>

                {/* Excerpt (if present) */}
                {article.excerpt && (
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-primary-500 pl-5 mb-8 font-medium">
                    {article.excerpt}
                  </p>
                )}

                {/* Article Body */}
                <div className="prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                  {(article.content || '').split('\n').map((para, i) =>
                    para.trim() ? (
                      <p key={i} className="mb-5 leading-[1.85]">{para}</p>
                    ) : (
                      <div key={i} className="mb-3" />
                    )
                  )}
                </div>

                {/* Back nav */}
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
                  <Link
                    to="/news"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <FaArrowLeft size={12} /> Back to All News
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Share this article:</span>
                    <button onClick={shareOnFacebook} className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"><FaFacebook size={12} /></button>
                    <button onClick={shareOnTwitter} className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center hover:bg-sky-100 transition-colors"><FaTwitter size={12} /></button>
                    <button onClick={handleCopyLink} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"><FaLink size={11} /></button>
                  </div>
                </div>
              </motion.article>

              {/* ── SIDEBAR ── */}
              <aside className="lg:w-72 xl:w-80 flex-shrink-0">
                <div className="sticky top-24 space-y-6">

                  {/* Related Articles */}
                  {related.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
                    >
                      <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-wide uppercase mb-4 flex items-center gap-2">
                        <span className="w-5 h-0.5 bg-primary-500 rounded" />
                        More Articles
                      </h3>
                      <div className="space-y-1">
                        {related.map(item => (
                          <RelatedCard key={item._id} item={item} />
                        ))}
                      </div>
                      <Link
                        to="/news"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-colors"
                      >
                        View All News <FaArrowRight size={10} />
                      </Link>
                    </motion.div>
                  )}

                  {/* Category badge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
                  >
                    <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-wide uppercase mb-3 flex items-center gap-2">
                      <span className="w-5 h-0.5 bg-primary-500 rounded" />
                      Article Info
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Category</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_COLOR[article?.cat] || CAT_COLOR.General}`}>{article?.cat || 'General'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Published</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(article?.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reading time</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{readingTime(article?.content || '')} min</span>
                      </div>
                      {article?.views > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Views</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{article.views.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                </div>
              </aside>

            </div>
          )}
        </div>
      </section>

      <ScrollTop />
    </>
  )
}
