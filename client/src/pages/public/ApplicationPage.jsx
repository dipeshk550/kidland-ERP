import { useState, useRef, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FaArrowRight, FaArrowLeft, FaCheckCircle, FaUpload, FaUser,
  FaGraduationCap, FaFileAlt, FaEye, FaTrash, FaFileImage, FaFilePdf,
  FaPhoneAlt, FaEnvelope, FaCamera
} from 'react-icons/fa'
import { ScrollTop } from '../../components/ui/index'
import { useSettings } from '../../context/SettingsContext'
import api from '../../services/api'
import SCHOOL_LOGO from '../../assets/kidland-logo.jpg'

/* ─── Steps ─────────────────────────────────────────────────────── */
const STEPS = [
  { label: 'Personal Info',  short: 'Personal',  Icon: FaUser },
  { label: 'Academic Info',  short: 'Academic',  Icon: FaGraduationCap },
  { label: 'Documents',      short: 'Documents', Icon: FaFileAlt },
  { label: 'Review',         short: 'Review',    Icon: FaEye },
]
const FIELDS = [
  ['studentName', 'dob', 'gender', 'phone', 'address'],  // Step 0: Personal
  ['classApplying', 'parentName', 'email'],               // Step 1: Academic
  [],                                                      // Step 2: Documents
  [],                                                      // Step 3: Review
]
const DOC_FIELDS = [
  { key: 'birthCert',    label: 'Birth Certificate',        required: true },
  { key: 'markSheet',    label: 'Previous Year Mark Sheet', required: true },
  { key: 'transferCert', label: 'Transfer Certificate',     required: false },
]

/* ─── Section header bar (green, like reference image) ──────────── */
function SectionBar({ children }) {
  return (
    <div
      className="text-white text-center font-bold text-sm tracking-widest uppercase py-2.5 px-4 mb-6 rounded-sm"
      style={{ background: 'linear-gradient(90deg, #0f6e0d, #54B435, #0f6e0d)' }}
    >
      {children}
    </div>
  )
}

/* ─── Underline-style field label ───────────────────────────────── */
function FLabel({ children }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
      {children}
    </label>
  )
}

// IMPORTANT: must use forwardRef so react-hook-form's register() ref reaches the DOM node
const FInput = forwardRef(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full border-0 border-b-2 border-gray-300 focus:border-primary-500 bg-transparent outline-none py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 transition-colors ${className}`}
    {...props}
  />
))
FInput.displayName = 'FInput'

const FSelect = forwardRef(({ children, className = '', ...props }, ref) => (
  <select
    ref={ref}
    className={`w-full border-0 border-b-2 border-gray-300 focus:border-primary-500 bg-transparent outline-none py-2 text-sm text-gray-800 dark:text-gray-100 transition-colors ${className}`}
    {...props}
  >
    {children}
  </select>
))
FSelect.displayName = 'FSelect'

function FError({ msg }) {
  return msg ? <p className="text-red-500 text-[10px] mt-0.5 font-medium">{msg}</p> : null
}

/* ─── Passport Photo Upload ─────────────────────────────────────── */
function PassportPhotoBox({ photo, onChange }) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Image only (JPG/PNG)'); return }
    if (f.size > 2 * 1024 * 1024) { toast.error('Max 2MB for photo'); return }
    const reader = new FileReader()
    reader.onload = e => onChange(e.target.result, f)
    reader.readAsDataURL(f)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]) }}
        className={`w-28 h-32 border-2 border-dashed rounded-sm cursor-pointer flex flex-col items-center justify-center transition-all relative overflow-hidden
          ${drag ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-gray-50 dark:bg-gray-800'}`}
      >
        {photo ? (
          <img src={photo} alt="Passport" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-2 text-center">
            <FaCamera className="text-gray-300" size={24} />
            <span className="text-[9px] text-gray-400 font-semibold leading-tight">Passport Size Photo</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 uppercase tracking-wide"
      >
        <FaUpload size={9} /> Click to Upload *
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  )
}

/* ─── Document Upload Box ───────────────────────────────────────── */
function DocUploadBox({ label, required, file, onChange, onRemove }) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      toast.error('Only images or PDF allowed'); return
    }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    onChange(f)
  }

  return (
    <div>
      <FLabel>{label} {required && <span className="text-red-500">*</span>}</FLabel>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]) }}
        className={`rounded border-2 border-dashed transition-all mt-1 ${drag ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-gray-600'}`}
      >
        {file ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              {file.type === 'application/pdf'
                ? <FaFilePdf className="text-red-400" size={16} />
                : <FaFileImage className="text-primary-400" size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={onRemove}
              className="w-8 h-8 rounded bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0">
              <FaTrash size={11} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
            <div className="w-9 h-9 rounded bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <FaUpload className="text-gray-300" size={14} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Click to upload or drag here</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG · max 5MB</p>
            </div>
            <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => handleFile(e.target.files?.[0])} />
          </label>
        )}
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function ApplicationPage() {
  const { settings } = useSettings()
  const [step,      setStep]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refId,     setRefId]     = useState('')
  const [docs,         setDocs]        = useState({ birthCert: null, markSheet: null, transferCert: null })
  const [passport,     setPassport]    = useState({ dataUrl: null, file: null })
  const [photoTouched, setPhotoTouched]= useState(false)

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm()

  const next = async () => {
    const ok = await trigger(FIELDS[step])
    if (!ok) return
    if (step === 0 && !passport.dataUrl) {
      setPhotoTouched(true)
      toast.error('Please upload a passport size photo')
      return
    }
    if (step === 2) {
      const missing = DOC_FIELDS.filter(d => d.required && !docs[d.key])
      if (missing.length > 0) {
        toast.error(`Please upload: ${missing.map(d => d.label).join(', ')}`)
        return
      }
    }
    setStep(s => s + 1)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v) })
      if (passport.file)     formData.append('studentPhoto', passport.file)
      if (docs.birthCert)    formData.append('birthCert', docs.birthCert)
      if (docs.markSheet)    formData.append('markSheet', docs.markSheet)
      if (docs.transferCert) formData.append('transferCert', docs.transferCert)

      await api.post('/admissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30s for file uploads
      })

      // Only reach here if API call succeeded
      const ref = 'KS-' + Math.random().toString(36).slice(2, 8).toUpperCase()
      setRefId(ref)
      toast.success('Application submitted successfully!')
      setSubmitted(true)
    } catch (err) {
      const msg = err?.message || 'Submission failed. Please try again.'
      toast.error(msg)
      console.error('Admission submit error:', msg)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success Screen ── */
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 md:p-10 max-w-md w-full text-center border border-gray-100 dark:border-gray-800"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <FaCheckCircle className="text-green-500 text-4xl" />
        </div>
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white mb-3">Application Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your admission application has been received. Our team will review and contact you within 2 business days.
        </p>
        <div className="p-4 rounded bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 mb-4">
          <p className="text-xs text-gray-500 mb-1">Reference Number</p>
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400 tracking-wider">{refId}</p>
        </div>
        <p className="text-xs text-gray-400">Please save this reference number for future enquiries.</p>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
          <a href={`tel:${settings.phone1}`} className="flex items-center gap-1.5 hover:text-primary-500 transition-colors">
            <FaPhoneAlt size={11} /> {settings.phone1}
          </a>
          <a href={`mailto:${settings.email1}`} className="flex items-center gap-1.5 hover:text-primary-500 transition-colors">
            <FaEnvelope size={11} /> Email us
          </a>
        </div>
      </motion.div>
    </div>
  )

  const v = watch()
  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* ── Step Progress — ABOVE the card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4 mb-3">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700 z-0">
              <div className="h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%`, background: '#54B435' }} />
            </div>
            {STEPS.map((s, i) => (
              <div key={s.label} className="relative z-10 flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all shadow-sm ${
                  i < step
                    ? 'text-white border-primary-500'
                    : i === step
                    ? 'bg-white dark:bg-gray-900 border-primary-500 text-primary-600 ring-4 ring-primary-100 dark:ring-primary-900'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400'
                }`} style={i < step ? { background: '#54B435' } : {}}>
                  {i < step ? <FaCheckCircle size={15} /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold hidden sm:block uppercase tracking-widest text-center ${
                  i === step ? 'text-primary-600 dark:text-primary-400' : i < step ? 'text-primary-400' : 'text-gray-400'
                }`}>{s.short}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Outer bordered card ── */}
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: '2px solid #54B435' }}>
          {/* ── School Header Card ── */}
          <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-100"
            style={{ background: 'linear-gradient(to right, #f8fef8, #ffffff)' }}>
            {/* School Logo */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-primary-300 dark:ring-primary-700 shadow-md">
              <img src={SCHOOL_LOGO} alt="Kidland School Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-base md:text-xl text-primary-700 dark:text-primary-400 leading-tight tracking-wide uppercase">
                {settings.name || 'Kidland School'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {settings.address || 'Kusunti, Lalitpur-13, Nepal'}
                {settings.est ? ` | Est. ${settings.est}` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FaPhoneAlt size={9} className="text-primary-500" /> {settings.phone1}
                </span>
                {settings.phone2 && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FaPhoneAlt size={9} className="text-primary-500" /> {settings.phone2}
                  </span>
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FaEnvelope size={9} className="text-primary-500" /> {settings.email1}
                </span>
              </div>
            </div>
          </div>

          {/* ── Application Form Title Banner ── */}
          <div
            className="py-4 text-center border-b border-gray-100"
            style={{ background: 'linear-gradient(to bottom, #f9fafb, #ffffff)' }}
          >
            <h2 className="text-lg md:text-2xl font-black tracking-[0.12em] uppercase text-primary-700 dark:text-primary-400">
              Online Application Form
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 tracking-wide">
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}
            </p>
          </div>

          {/* ── Main Form ── */}
          <div className="bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-5 md:px-8 pt-6 pb-4">
              <AnimatePresence mode="wait">

                {/* ── STEP 0: Personal Info ── */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <SectionBar>Personal Information</SectionBar>
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Left fields */}
                      <div className="flex-1 space-y-5">
                        <div>
                          <FLabel>Full Name *</FLabel>
                          <FInput
                            {...register('studentName', { required: 'Required' })}
                            placeholder="Your full name"
                            className={errors.studentName ? 'border-red-400' : ''}
                          />
                          <FError msg={errors.studentName?.message} />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <FLabel>Gender *</FLabel>
                            <FSelect {...register('gender', { required: 'Required' })}
                              className={errors.gender ? 'border-red-400' : ''}>
                              <option value="">Select</option>
                              <option>Male</option>
                              <option>Female</option>
                              <option>Other</option>
                            </FSelect>
                            <FError msg={errors.gender?.message} />
                          </div>
                          <div>
                            <FLabel>Date of Birth *</FLabel>
                            <FInput
                              type="date"
                              {...register('dob', { required: 'Required' })}
                              className={errors.dob ? 'border-red-400' : ''}
                            />
                            <FError msg={errors.dob?.message} />
                          </div>
                        </div>
                        <div>
                          <FLabel>Mobile No. *</FLabel>
                          <FInput
                            {...register('phone', { required: 'Required' })}
                            placeholder="+977-"
                            className={errors.phone ? 'border-red-400' : ''}
                          />
                          <FError msg={errors.phone?.message} />
                        </div>
                        <div>
                          <FLabel>Address *</FLabel>
                          <FInput
                            {...register('address', { required: 'Required' })}
                            placeholder="Province, District, Municipality"
                            className={errors.address ? 'border-red-400' : ''}
                          />
                          <FError msg={errors.address?.message} />
                        </div>
                        <div>
                          <FLabel>Nationality</FLabel>
                          <FInput {...register('nationality')} defaultValue="Nepali" />
                        </div>
                      </div>

                      {/* Right: passport photo */}
                      <div className="sm:w-36 flex flex-col items-center gap-3 pt-2">
                        <PassportPhotoBox
                          photo={passport.dataUrl}
                          onChange={(dataUrl, file) => setPassport({ dataUrl, file })}
                        />
                        {photoTouched && !passport.dataUrl && (
                          <p className="text-[10px] text-red-500 font-semibold text-center">Required *</p>
                        )}
                        {passport.dataUrl && (
                          <p className="text-[10px] text-green-600 font-semibold text-center">✓ Uploaded</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 1: Academic Info ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <SectionBar>Academic Information</SectionBar>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <FLabel>Class Applying For *</FLabel>
                          <FSelect {...register('classApplying', { required: 'Required' })}
                            className={errors.classApplying ? 'border-red-400' : ''}>
                            <option value="">Select class</option>
                            {['Nursery', 'LKG', 'UKG', ...[1,2,3,4,5,6,7,8,9,10].map(g => `Grade ${g}`)].map(c => (
                              <option key={c}>{c}</option>
                            ))}
                          </FSelect>
                          <FError msg={errors.classApplying?.message} />
                        </div>
                        <div>
                          <FLabel>Previous School</FLabel>
                          <FInput {...register('prevSchool')} placeholder="Name of previous school" />
                        </div>
                      </div>
                      <div>
                        <FLabel>Parent / Guardian Name *</FLabel>
                        <FInput
                          {...register('parentName', { required: 'Required' })}
                          placeholder="Full name of parent or guardian"
                          className={errors.parentName ? 'border-red-400' : ''}
                        />
                        <FError msg={errors.parentName?.message} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <FLabel>Mobile No. (Guardian) *</FLabel>
                          <FInput
                            {...register('guardianPhone')}
                            placeholder="+977-"
                          />
                        </div>
                        <div>
                          <FLabel>Email Address *</FLabel>
                          <FInput
                            type="email"
                            {...register('email', { required: 'Required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                            placeholder="your@email.com"
                            className={errors.email ? 'border-red-400' : ''}
                          />
                          <FError msg={errors.email?.message} />
                        </div>
                      </div>
                      <div>
                        <FLabel>Additional Message</FLabel>
                        <textarea
                          {...register('message')}
                          rows={3}
                          placeholder="Any additional information or special requirements..."
                          className="w-full border-0 border-b-2 border-gray-300 focus:border-primary-500 bg-transparent outline-none py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 resize-none transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: Documents ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <SectionBar>Upload Documents</SectionBar>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center">
                      Upload clear scans or photos. PDF, JPG, PNG — max 5MB each.
                    </p>
                    <div className="space-y-5">
                      {DOC_FIELDS.map(d => (
                        <DocUploadBox
                          key={d.key}
                          label={d.label}
                          required={d.required}
                          file={docs[d.key]}
                          onChange={f => setDocs(prev => ({ ...prev, [d.key]: f }))}
                          onRemove={() => setDocs(prev => ({ ...prev, [d.key]: null }))}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: Review ── */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <SectionBar>Review & Submit</SectionBar>

                    <div className="flex gap-5 mb-5">
                      {/* Photo preview */}
                      {passport.dataUrl && (
                        <div className="shrink-0">
                          <img src={passport.dataUrl} alt="Passport" className="w-20 h-24 object-cover border-2 border-gray-200 rounded-sm" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">{v.studentName || '—'}</h3>
                        <p className="text-sm text-gray-500">{v.classApplying} · {v.gender}</p>
                        <p className="text-xs text-gray-400 mt-1">{v.dob}</p>
                      </div>
                    </div>

                    {/* Details table */}
                    <div className="rounded border border-gray-100 dark:border-gray-700 overflow-hidden mb-4">
                      {[
                        ['Student Name', v.studentName],
                        ['Date of Birth', v.dob],
                        ['Gender', v.gender],
                        ['Nationality', v.nationality || 'Nepali'],
                        ['Class Applying', v.classApplying],
                        ['Previous School', v.prevSchool || '—'],
                        ['Parent / Guardian', v.parentName],
                        ['Phone', v.phone],
                        ['Email', v.email],
                        ['Address', v.address],
                      ].map(([l, val]) => (
                        <div key={l} className="flex items-start gap-4 px-4 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0 even:bg-gray-50/60 dark:even:bg-gray-800/20">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-32 shrink-0 pt-0.5">{l}</span>
                          <span className="text-sm text-gray-800 dark:text-gray-200">{val || '—'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Documents summary */}
                    <div className="rounded border border-gray-100 dark:border-gray-700 p-4 mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Uploaded Documents</p>
                      <div className="space-y-2">
                        {DOC_FIELDS.map(d => (
                          <div key={d.key} className="flex items-center gap-2 text-sm">
                            {docs[d.key]
                              ? <FaCheckCircle className="text-green-500 shrink-0" size={13} />
                              : <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0 inline-block" />}
                            <span className={docs[d.key] ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>{d.label}</span>
                            {docs[d.key] && (
                              <span className="text-xs text-gray-400 ml-auto truncate max-w-[140px]">{docs[d.key].name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Agree */}
                    <div className="flex items-start gap-3 p-4 rounded bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                      <input
                        type="checkbox"
                        id="agree"
                        {...register('agree', { required: 'You must agree to proceed' })}
                        className="mt-0.5 accent-primary-500 w-4 h-4 shrink-0"
                      />
                      <label htmlFor="agree" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-snug">
                        I confirm that all information provided is accurate and I agree to {settings.name || 'Kidland School'}'s admission terms and conditions.
                      </label>
                    </div>
                    {errors.agree && <p className="text-red-500 text-xs mt-1">{errors.agree.message}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Navigation buttons ── */}
            <div className="flex justify-between items-center px-5 md:px-8 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <FaArrowLeft size={11} /> Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={next}
                  className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #0f6e0d, #54B435)' }}>
                  Next Step <FaArrowRight size={11} />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-7 py-2.5 rounded font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 min-w-44 justify-center"
                  style={{ background: 'linear-gradient(135deg, #0f6e0d, #54B435)' }}>
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                    : <>Submit Application <FaArrowRight size={11} /></>}
                </button>
              )}
            </div>
            </form>
          </div>

        </div>{/* end outer bordered card */}

        {/* Help text — outside the card */}
        <p className="text-center text-sm text-gray-400 mt-5 pb-4">
          Need help? Call{' '}
          <a href={`tel:${settings.phone1}`} className="font-bold text-primary-500 hover:underline">{settings.phone1}</a>
          {' '}or email{' '}
          <a href={`mailto:${settings.email1}`} className="font-bold text-primary-500 hover:underline">{settings.email1}</a>
        </p>

      </div>
      <ScrollTop />
    </div>
  )
}
