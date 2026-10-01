import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaExpand, FaTimes, FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa'
import { PageHero, ScrollTop } from '../../components/ui/index'
import api from '../../services/api'

const FALLBACK_GALLERY = [
  { _id: '1', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-19-at-4.52.21-PM.jpeg', title: 'School Activities', cat: 'Students' },
  { _id: '2', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5326-scaled.jpg', title: 'Student Life', cat: 'Students' },
  { _id: '3', src: 'https://kidlandschool.edu.np/wp-content/uploads/2025/08/IMG_2262-1-scaled.jpg', title: 'School Events', cat: 'Events' },
  { _id: '4', src: 'https://kidlandschool.edu.np/wp-content/uploads/2025/07/IMG_0893-scaled.jpg', title: 'Sports Day', cat: 'Sports' },
  { _id: '5', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5607-scaled.jpg', title: 'Activities', cat: 'Students' },
  { _id: '6', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-19-at-4.52.23-PM.jpeg', title: 'Programme', cat: 'Events' },
  { _id: '7', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5260-scaled.jpg', title: 'ECA Activities', cat: 'ECA' },
  { _id: '8', src: 'https://kidlandschool.edu.np/wp-content/uploads/2025/09/IMG_3237-1-scaled.jpg', title: 'Cultural Events', cat: 'Cultural' },
  { _id: '9', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/02/WhatsApp-Image-2026-02-19-at-4.33.27-PM-2-1.jpeg', title: 'School Life', cat: 'School' },
  { _id: '10', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/02/WhatsApp-Image-2026-02-19-at-4.33.15-PM-1-1.jpeg', title: 'Students', cat: 'Students' },
  { _id: '11', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5299-1-scaled.jpg', title: 'School Events', cat: 'Events' },
  { _id: '12', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5549-scaled.jpg', title: 'ECA Programme', cat: 'ECA' },
]

const CATS = ['All', 'School', 'Students', 'Events', 'ECA', 'Sports', 'Cultural']

export default function GalleryPage() {
  const [cat, setCat] = useState('All')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Lightbox State
  const [lb, setLb] = useState(null)
  const [lbIdx, setLbIdx] = useState(0)

  useEffect(() => {
    const fetchPublicGallery = async () => {
      try {
        setLoading(true)
        const params = {
          page,
          limit,
          cat: cat !== 'All' ? cat : undefined,
        }
        const res = await api.get('/gallery', { params })
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setItems(res.data)
          setTotalPages(res.pages || 1)
          setTotalItems(res.total ?? res.data.length)
        } else {
          // Fallback filtering if backend database hasn't populated items
          const filteredFallback = cat === 'All'
            ? FALLBACK_GALLERY
            : FALLBACK_GALLERY.filter(g => g.cat === cat)
          const start = (page - 1) * limit
          const pageItems = filteredFallback.slice(start, start + limit)
          setItems(pageItems.length > 0 ? pageItems : filteredFallback)
          setTotalPages(Math.ceil(filteredFallback.length / limit) || 1)
          setTotalItems(filteredFallback.length)
        }
      } catch (err) {
        // Fallback
        const filteredFallback = cat === 'All' ? FALLBACK_GALLERY : FALLBACK_GALLERY.filter(g => g.cat === cat)
        setItems(filteredFallback)
        setTotalPages(1)
        setTotalItems(filteredFallback.length)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicGallery()
  }, [cat, page])

  const handleCategoryChange = (newCat) => {
    setCat(newCat)
    setPage(1)
  }

  const openLightbox = (g, i) => {
    setLb(g)
    setLbIdx(i)
  }

  const prevLightbox = () => {
    const n = (lbIdx - 1 + items.length) % items.length
    setLbIdx(n)
    setLb(items[n])
  }

  const nextLightbox = () => {
    const n = (lbIdx + 1) % items.length
    setLbIdx(n)
    setLb(items[n])
  }

  return (
    <>
      <PageHero
        tag="Gallery"
        title="School Photo Gallery"
        sub="Glimpses of vibrant student life, academic achievements, events and ECA activities at Kidland School."
        breadcrumbs={[{ label: 'Gallery' }]}
      />

      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8">
          
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => handleCategoryChange(c)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  c === cat
                    ? 'bg-primary-400 text-white shadow-md shadow-primary-400/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-6">
            <span>Showing {items.length} of {totalItems} images</span>
            {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="break-inside-avoid mb-3 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"/>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <FaImage className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3"/>
              <p className="text-base font-bold text-gray-700 dark:text-gray-300">No images found in "{cat}"</p>
              <p className="text-xs text-gray-400 mt-1">Please check back later or choose another category.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              <AnimatePresence>
                {items.map((g, i) => (
                  <motion.div
                    key={g._id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="break-inside-avoid mb-3 group relative cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-gray-100 dark:bg-gray-800"
                    onClick={() => openLightbox(g, i)}
                  >
                    <img
                      src={g.src}
                      alt={g.title}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ minHeight: '120px' }}
                      onError={e => {
                        e.target.parentElement.style.background = 'linear-gradient(135deg,#54B435,#41a020)'
                        e.target.parentElement.style.minHeight = '150px'
                        e.target.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all flex items-center justify-center">
                      <FaExpand className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20}/>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-xs font-bold truncate">{g.title}</p>
                      <p className="text-primary-300 text-[10px] uppercase font-semibold tracking-wider mt-0.5">{g.cat}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
              >
                <FaChevronLeft size={10}/> Previous
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const p = idx + 1
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        p === page
                          ? 'bg-primary-400 text-white shadow-md shadow-primary-400/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
              >
                Next <FaChevronRight size={10}/>
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lb && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
            onClick={() => setLb(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lb.src}
                alt={lb.title}
                className="w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
                onError={e => {
                  e.target.parentElement.style.background = 'linear-gradient(135deg,#54B435,#41a020)'
                  e.target.style.display = 'none'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                <p className="text-white font-bold text-base">{lb.title}</p>
                <p className="text-primary-300 text-xs font-medium uppercase tracking-wider">{lb.cat}</p>
              </div>

              <button
                onClick={() => setLb(null)}
                className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-100"
              >
                <FaTimes className="text-gray-900" size={14}/>
              </button>
              
              {items.length > 1 && (
                <>
                  <button
                    onClick={prevLightbox}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/35 rounded-full flex items-center justify-center text-white backdrop-blur-xs transition-all"
                  >
                    <FaChevronLeft size={14}/>
                  </button>
                  <button
                    onClick={nextLightbox}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/35 rounded-full flex items-center justify-center text-white backdrop-blur-xs transition-all"
                  >
                    <FaChevronRight size={14}/>
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollTop/>
    </>
  )
}
