import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FaEye, FaDownload, FaHourglass, FaCheckCircle, FaTimesCircle, FaUsers,
  FaFileAlt, FaFilePdf, FaFileImage, FaExternalLinkAlt, FaTrash, FaStickyNote, FaUserGraduate
} from 'react-icons/fa'
import { Badge, Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import api from '../../services/api'

const STATUS_COLORS = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' }
const PER = 8
const API_BASE = (() => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace('/api', '')
  return ''
})()
const DOC_FIELDS = [
  { key: 'birthCert',    label: 'Birth Certificate' },
  { key: 'markSheet',    label: 'Previous Mark Sheet' },
  { key: 'transferCert', label: 'Transfer Certificate' },
]

function fileIcon(path) {
  if (!path) return FaFileAlt
  return path.toLowerCase().endsWith('.pdf') ? FaFilePdf : FaFileImage
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200">{value || '—'}</span>
    </div>
  )
}

function ProtectedImage({ admissionId, alt, className }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl = ''
    api.get(`/admissions/${admissionId}/documents/studentPhoto`, { responseType: 'blob' })
      .then(blob => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {})
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [admissionId])
  return src ? <img src={src} alt={alt} className={className} /> : <FaUserGraduate className="text-gray-300" />
}

export default function ManageAdmissions() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [statusFilter,setStatusFilter]= useState('All')
  const [page,        setPage]        = useState(1)
  const [viewing,     setViewing]     = useState(null)
  const [confirmId,   setConfirmId]   = useState(null)
  const [noteModal,   setNoteModal]   = useState(null)   // { id, note }
  const [noteText,    setNoteText]    = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/admissions')
      .then(r => {
        const list = Array.isArray(r) ? r : (r?.data ?? [])
        if (list.length) setItems(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => items.filter(it =>
    (statusFilter === 'All' || it.status === statusFilter.toLowerCase()) &&
    ((it.studentName || it.name || '').toLowerCase().includes(search.toLowerCase()) ||
     (it.classApplying || '').toLowerCase().includes(search.toLowerCase()))
  ), [items, search, statusFilter])

  const paged = filtered.slice((page - 1) * PER, page * PER)

  /* ── Update status ── */
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admissions/${id}`, { status })
    } catch {
      try { await api.put(`/admissions/${id}/status`, { status }) } catch {}
    }
    setItems(its => its.map(it => (it._id || it.id) === id ? { ...it, status } : it))
    toast.success(`Application ${status}`)
    setViewing(v => v ? { ...v, status } : null)
  }

  /* ── Delete ── */
  const doDelete = async (id) => {
    try { await api.delete(`/admissions/${id}`) } catch {}
    setItems(its => its.filter(it => (it._id || it.id) !== id))
    setViewing(null)
    toast.success('Application deleted')
  }

  /* ── Save note ── */
  const saveNote = async () => {
    if (!noteModal) return
    const { id } = noteModal
    try {
      await api.put(`/admissions/${id}`, { note: noteText })
    } catch {}
    setItems(its => its.map(it => (it._id || it.id) === id ? { ...it, note: noteText } : it))
    setViewing(v => v ? { ...v, note: noteText } : null)
    toast.success('Note saved')
    setNoteModal(null)
    setNoteText('')
  }

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = [
      'Student Name', 'Date of Birth', 'Gender', 'Nationality', 'Class Applying',
      'Previous School', 'Parent/Guardian', 'Phone', 'Email', 'Address', 'Message',
      'Birth Certificate', 'Mark Sheet', 'Transfer Certificate',
      'Applied Date', 'Status', 'Note',
    ]
    const escape = (val) => {
      const s = (val ?? '').toString().replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }
    const rows = filtered.map(it => [
      it.studentName || it.name || '',
      it.dob || '',
      it.gender || '',
      it.nationality || 'Nepali',
      it.classApplying || '',
      it.prevSchool || '',
      it.parentName || '',
      it.phone || '',
      it.email || '',
      it.address || '',
      it.message || '',
      it.birthCert ? 'Uploaded' : 'Not uploaded',
      it.markSheet ? 'Uploaded' : 'Not uploaded',
      it.transferCert ? 'Uploaded' : 'Not uploaded',
      (it.createdAt || '').slice(0, 10),
      it.status || 'pending',
      it.note || '',
    ].map(escape).join(','))

    const csv = [headers.map(escape).join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `admissions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('CSV exported')
  }

  const counts = {
    total:    items.length,
    pending:  items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  }

  const docUrl = (path, admissionId, field) => path?.startsWith('http')
    ? path
    : `${API_BASE}/api/admissions/${admissionId}/documents/${field}`

  return (
    <AdminPage
      title="Admission Applications"
      subtitle="Review, approve and manage student admission applications"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total',    val: counts.total,    icon: FaUsers,          color: 'bg-blue-50 dark:bg-blue-900/20',   ic: 'text-blue-500' },
          { label: 'Pending',  val: counts.pending,  icon: FaHourglass,      color: 'bg-yellow-50 dark:bg-yellow-900/20', ic: 'text-yellow-500' },
          { label: 'Approved', val: counts.approved, icon: FaCheckCircle,    color: 'bg-green-50 dark:bg-green-900/20',  ic: 'text-green-500' },
          { label: 'Rejected', val: counts.rejected, icon: FaTimesCircle,    color: 'bg-red-50 dark:bg-red-900/20',     ic: 'text-red-500' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className={s.ic} size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.val}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search & export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder="Search by name or class..."
          filters={['All', 'Pending', 'Approved', 'Rejected']}
          activeFilter={statusFilter}
          onFilter={f => { setStatusFilter(f); setPage(1) }}
        />
        <button onClick={exportCSV} className="btn-outline py-2 px-4 text-sm shrink-0">
          <FaDownload size={12} /> Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={5} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Applicant', 'Class', 'Parent', 'Phone', 'Photo', 'Documents', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400">No applications found</td></tr>
                ) : paged.map((app, i) => {
                  const docCount = DOC_FIELDS.filter(d => app[d.key]).length
                  const id = app._id || app.id
                  return (
                    <motion.tr
                      key={id || i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="table-row"
                    >
                      {/* Applicant */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          {app.studentPhoto ? (
                            <ProtectedImage admissionId={id} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs shrink-0">
                              {(app.studentName || app.name || 'A')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-sm">{app.studentName || app.name}</div>
                            <div className="text-xs text-gray-400">{app.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-medium">{app.classApplying}</td>
                      <td className="table-cell">{app.parentName}</td>
                      <td className="table-cell">{app.phone}</td>
                      {/* Passport photo indicator */}
                      <td className="table-cell">
                        {app.studentPhoto
                          ? <span className="badge badge-green"><FaUserGraduate size={9} />Yes</span>
                          : <span className="badge badge-gray">—</span>}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${docCount === 3 ? 'badge-green' : docCount > 0 ? 'badge-yellow' : 'badge-gray'}`}>
                          <FaFileAlt size={9} />{docCount}/3
                        </span>
                      </td>
                      <td className="table-cell text-gray-500">{(app.createdAt || '').slice(0, 10)}</td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_COLORS[app.status] || 'badge-gray'}`}>{app.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1.5 justify-end">
                          {/* View */}
                          <button onClick={() => setViewing(app)}
                            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors" title="View details">
                            <FaEye size={12} />
                          </button>
                          {/* Note */}
                          <button onClick={() => { setNoteModal({ id }); setNoteText(app.note || '') }}
                            className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-colors" title="Add note">
                            <FaStickyNote size={12} />
                          </button>
                          {/* Delete */}
                          <button onClick={() => setConfirmId(id)}
                            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Delete">
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} label="applications" />

      {/* ── View / Detail Modal ── */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Application Details" size="lg">
        {viewing && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              {viewing.studentPhoto ? (
                <ProtectedImage admissionId={viewing._id || viewing.id} alt="Student" className="w-16 h-20 object-cover rounded border-2 border-gray-200 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {(viewing.studentName || viewing.name || 'A')[0]}
                </div>
              )}
              <div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">{viewing.studentName || viewing.name}</div>
                <div className="text-gray-500 text-sm">{viewing.classApplying} · {viewing.gender}</div>
                <span className={`badge ${STATUS_COLORS[viewing.status] || 'badge-gray'} mt-1`}>{viewing.status}</span>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Personal Details</p>
              </div>
              <div className="px-4 py-1">
                <InfoRow label="Date of Birth" value={viewing.dob} />
                <InfoRow label="Nationality"   value={viewing.nationality || 'Nepali'} />
                <InfoRow label="Parent / Guardian" value={viewing.parentName} />
                <InfoRow label="Phone"         value={viewing.phone} />
                <InfoRow label="Email"         value={viewing.email} />
                <InfoRow label="Address"       value={viewing.address} />
                <InfoRow label="Previous School" value={viewing.prevSchool} />
                <InfoRow label="Applied Date"  value={(viewing.createdAt || '').slice(0, 10)} />
              </div>
            </div>

            {/* Note */}
            {viewing.note && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <FaStickyNote size={10} /> Admin Note
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{viewing.note}</div>
              </div>
            )}

            {/* Message */}
            {viewing.message && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Applicant's Message</div>
                <div className="text-sm text-gray-800 dark:text-gray-100">{viewing.message}</div>
              </div>
            )}

            {/* Documents */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Uploaded Documents</p>
              <div className="space-y-2">
                {DOC_FIELDS.map(d => {
                  const path = viewing[d.key]
                  const Icon = fileIcon(path)
                  return (
                    <div key={d.key} className={`flex items-center gap-3 p-3 rounded-xl border ${path ? 'border-gray-100 dark:border-gray-700' : 'border-dashed border-gray-200 dark:border-gray-700'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${path ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <Icon className={path ? 'text-primary-400' : 'text-gray-300'} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.label}</div>
                        <div className="text-xs text-gray-400">{path ? 'Uploaded' : 'Not uploaded'}</div>
                      </div>
                      {path && (
                        <div className="flex gap-1.5 shrink-0">
                          <a href={docUrl(path, viewing._id || viewing.id, d.key)} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center hover:bg-primary-100 transition-colors">
                            <FaExternalLinkAlt size={11} />
                          </a>
                          <a href={docUrl(path, viewing._id || viewing.id, d.key)} download
                            className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <FaDownload size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setNoteModal({ id: viewing._id || viewing.id }); setNoteText(viewing.note || '') }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <FaStickyNote size={12} /> {viewing.note ? 'Edit Note' : 'Add Note'}
              </button>
              {viewing.status !== 'approved' && (
                <button onClick={() => updateStatus(viewing._id || viewing.id, 'approved')}
                  className="btn-primary flex-1 justify-center py-2.5 min-w-28">
                  <FaCheckCircle size={13} /> Approve
                </button>
              )}
              {viewing.status !== 'rejected' && (
                <button onClick={() => updateStatus(viewing._id || viewing.id, 'rejected')}
                  className="btn-danger flex-1 justify-center py-2.5 min-w-28">
                  <FaTimesCircle size={13} /> Reject
                </button>
              )}
              {viewing.status !== 'pending' && (
                <button onClick={() => updateStatus(viewing._id || viewing.id, 'pending')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-200 dark:border-yellow-700 text-yellow-600 text-sm font-semibold hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                  <FaHourglass size={12} /> Set Pending
                </button>
              )}
              <button onClick={() => { setConfirmId(viewing._id || viewing.id); setViewing(null) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors ml-auto">
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Note Modal ── */}
      <Modal open={!!noteModal} onClose={() => { setNoteModal(null); setNoteText('') }} title="Admin Note" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Add an internal note for this application (not visible to applicant).</p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
            className="field resize-none"
            placeholder="Write your note here..."
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setNoteModal(null); setNoteText('') }} className="btn-ghost">Cancel</button>
            <button type="button" onClick={saveNote} className="btn-primary">Save Note</button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Confirm
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => doDelete(confirmId)}
        title="Delete Application"
        message="Permanently delete this application and all uploaded documents? This cannot be undone."
      />
    </AdminPage>
  )
}
