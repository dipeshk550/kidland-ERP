import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { FaTrash, FaPlus, FaUpload, FaImage, FaEdit, FaChevronLeft, FaChevronRight, FaLink } from 'react-icons/fa'
import { Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import api from '../../services/api'

const CATS = ['School', 'Students', 'Events', 'ECA', 'Sports', 'Cultural']

export default function ManageGallery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Modal State (Create / Edit)
  const [modal, setModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  // Form State
  const [title, setTitle] = useState('')
  const [selCat, setSelCat] = useState('School')
  const [inputTab, setInputTab] = useState('upload') // 'upload' | 'url'
  const [preview, setPreview] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const fetchGallery = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        cat: cat !== 'All' ? cat : undefined,
      }
      const res = await api.get('/gallery', { params })
      if (res && Array.isArray(res.data)) {
        setItems(res.data)
        setTotalPages(res.pages || 1)
        setTotalItems(res.total ?? res.data.length)
      } else if (Array.isArray(res)) {
        setItems(res)
        setTotalPages(1)
        setTotalItems(res.length)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGallery()
  }, [page, cat, search])

  // Reset page to 1 on category/search change
  const handleCatChange = (newCat) => {
    setCat(newCat)
    setPage(1)
  }

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  // Handle File Selection
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Max 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // Open Modal (Add or Edit)
  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setTitle(item.title || '')
      setSelCat(item.cat || 'School')
      setPreview(item.src || null)
      setUrlInput(item.src || '')
      setInputTab(item.src?.startsWith('data:') ? 'upload' : 'url')
    } else {
      setEditingItem(null)
      setTitle('')
      setSelCat('School')
      setPreview(null)
      setUrlInput('')
      setInputTab('upload')
    }
    setModal(true)
  }

  // Save (Create or Update)
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter an image title')
      return
    }
    const imgSrc = inputTab === 'upload' ? preview : urlInput.trim()
    if (!imgSrc) {
      toast.error('Please select an image file or provide an Image URL')
      return
    }

    try {
      setSaving(true)
      const payload = {
        title: title.trim(),
        src: imgSrc,
        cat: selCat,
        isPublic: true,
      }

      if (editingItem) {
        await api.put(`/gallery/${editingItem._id}`, payload)
        toast.success('Gallery image updated successfully')
      } else {
        await api.post('/gallery', payload)
        toast.success('Image added to gallery')
      }
      setModal(false)
      fetchGallery()
    } catch (err) {
      toast.error(err.message || 'Failed to save gallery image')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/gallery/${id}`)
      toast.success('Image removed from gallery')
      setConfirmId(null)
      fetchGallery()
    } catch (err) {
      toast.error(err.message || 'Failed to delete image')
    }
  }

  return (
    <AdminPage title="Gallery Management" subtitle="Create, edit, view and manage school photo gallery" onAdd={() => openModal()} addLabel="Add New Image">
      {/* Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <SearchBar value={search} onChange={handleSearchChange} placeholder="Search images by title..."/>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', ...CATS].map(c => (
            <button key={c} onClick={() => handleCatChange(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${c === cat
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Info & Items Count */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>Showing {totalItems > 0 ? ((page - 1) * limit) + 1 : 0}–{Math.min(page * limit, totalItems)} of {totalItems} images</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 py-8 text-center text-gray-400">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"/>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <FaImage className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3"/>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No gallery images found</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Click below to upload or add images to the gallery</p>
          <button onClick={() => openModal()} className="btn-primary inline-flex items-center gap-2">
            <FaPlus size={12}/> Add Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-6">
          <AnimatePresence>
            {items.map((img, i) => (
              <motion.div key={img._id || i}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.02 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                <img src={img.src} alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.parentElement.style.background = 'linear-gradient(135deg,#54B435,#41a020)'; e.target.style.display = 'none' }}/>
                
                {/* Hover overlay with Edit & Delete */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 p-2 text-center">
                  <p className="text-white text-xs font-bold line-clamp-2">{img.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => openModal(img)}
                      title="Edit Image"
                      className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-all shadow-md">
                      <FaEdit size={12}/>
                    </button>
                    <button onClick={() => setConfirmId(img._id)}
                      title="Delete Image"
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all shadow-md">
                      <FaTrash size={12}/>
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 pointer-events-none">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-xs">{img.cat}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <FaChevronLeft size={10}/> Previous
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, idx) => {
              const p = idx + 1
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${p === page
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                  {p}
                </button>
              )
            })}
          </div>

          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            Next <FaChevronRight size={10}/>
          </button>
        </div>
      )}

      {/* ── Add/Edit Image Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-800"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">
              {editingItem ? 'Edit Gallery Image' : 'Add New Gallery Image'}
            </h3>

            {/* Source Tab (File Upload vs Web URL) */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
              <button type="button" onClick={() => setInputTab('upload')}
                className={`pb-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${inputTab === 'upload' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <FaUpload size={11}/> File Upload
              </button>
              <button type="button" onClick={() => setInputTab('url')}
                className={`pb-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${inputTab === 'url' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <FaLink size={11}/> Image URL
              </button>
            </div>

            {inputTab === 'upload' ? (
              <div
                className={`border-2 border-dashed rounded-xl transition-all mb-4 ${dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                {preview ? (
                  <div className="relative p-2">
                    <img src={preview} alt="Preview" className="w-full aspect-video object-cover rounded-lg"/>
                    <button onClick={() => setPreview(null)}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow-md">
                      <FaTrash size={11}/>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <FaImage className="text-primary-500 text-3xl mx-auto mb-2"/>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Click to choose image or drag here</p>
                    <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP (Max 5MB)</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Image URL Address *</label>
                <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:border-primary-500"
                  placeholder="https://example.com/photo.jpg"/>
                {urlInput && (
                  <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={urlInput} alt="URL Preview" className="w-full h-36 object-cover"
                      onError={e => { e.target.parentElement.style.display = 'none' }}/>
                  </div>
                )}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Image Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:border-primary-500"
                placeholder="e.g. Annual Sports Day 2025"/>
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Category *</label>
              <select value={selCat} onChange={e => setSelCat(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:border-primary-500">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-xs font-bold bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                {saving ? 'Saving...' : editingItem ? 'Update Image' : 'Add Image'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Confirm
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Delete Gallery Image"
        message="Are you sure you want to permanently delete this image from the gallery?"
      />
    </AdminPage>
  )
}
