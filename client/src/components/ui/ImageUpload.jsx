import { useState, useRef } from 'react'
import { FaUpload, FaTrash, FaImage } from 'react-icons/fa'
import toast from 'react-hot-toast'

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageUpload({ value, onChange, label = 'Image', required = false, aspect = 'aspect-video', maxSizeMB = 5 }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return }
    if (file.size > maxSizeMB * 1024 * 1024) { toast.error(`File too large. Max ${maxSizeMB}MB.`); return }
    const dataUrl = await fileToDataUrl(file)
    onChange(dataUrl, file)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      {label && <label className="label">{label}{required && ' *'}</label>}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed transition-all overflow-hidden ${
          dragOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
        }`}
      >
        {value ? (
          <div className="relative">
            <img src={value} alt="Preview" className={`w-full ${aspect} object-cover`} />
            <button type="button" onClick={() => onChange(null, null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
              <FaTrash size={12} />
            </button>
            <button type="button" onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-black/75 transition-colors">
              <FaUpload size={10} /> Change
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-8 cursor-pointer text-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-1">
              <FaImage className="text-primary-400" size={20} />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to choose file or drag here</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP &middot; max {maxSizeMB}MB</p>
            <span className="mt-2 inline-flex items-center gap-2 bg-primary-400 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-500 transition-colors">
              <FaUpload size={12} /> Choose File
            </span>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </label>
        )}
      </div>
    </div>
  )
}
