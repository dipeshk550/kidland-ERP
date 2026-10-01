import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FaEnvelope, FaEnvelopeOpen, FaReply, FaTrash, FaEye,
  FaPhone, FaTag, FaUsers, FaInbox, FaCheckCircle, FaSearch,
  FaStickyNote, FaDownload
} from 'react-icons/fa'
import { Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import api from '../../services/api'

const PER = 12

const STATUS_STYLE = {
  unread:  { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    dot: 'bg-red-500',    label: 'Unread' },
  read:    { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',   dot: 'bg-gray-400',   label: 'Read' },
  replied: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', label: 'Replied' },
}

const SUBJECT_ICON = {
  'Admission Inquiry': '🎓',
  'Fee Structure':     '💰',
  'Scholarship':       '🏆',
  'Transportation':    '🚌',
  'ECA Activities':    '⚽',
  'General Query':     '❓',
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return d || '' }
}
function formatTime(d) {
  try {
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function ManageContacts() {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('All')
  const [page,       setPage]       = useState(1)
  const [viewing,    setViewing]    = useState(null)
  const [noteModal,  setNoteModal]  = useState(null)  // { id, note }
  const [noteText,   setNoteText]   = useState('')
  const [confirmId,  setConfirmId]  = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/contact')
      .then(r => {
        const list = Array.isArray(r) ? r : (r?.data ?? [])
        setItems(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => items.filter(it => {
    const matchStatus = filter === 'All' || it.status === filter.toLowerCase()
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (it.name || '').toLowerCase().includes(q) ||
      (it.email || '').toLowerCase().includes(q) ||
      (it.subject || '').toLowerCase().includes(q) ||
      (it.message || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  }), [items, search, filter])

  const paged = filtered.slice((page - 1) * PER, page * PER)

  const counts = {
    total:   items.length,
    unread:  items.filter(i => i.status === 'unread').length,
    read:    items.filter(i => i.status === 'read').length,
    replied: items.filter(i => i.status === 'replied').length,
  }

  /* ── Mark status ── */
  const markStatus = async (id, status) => {
    try { await api.put(`/contact/${id}`, { status }) } catch {}
    setItems(its => its.map(it => (it._id || it.id) === id ? { ...it, status } : it))
    setViewing(v => v ? { ...v, status } : null)
    toast.success(`Marked as ${status}`)
  }

  /* ── View message (auto mark read) ── */
  const openView = async (item) => {
    setViewing(item)
    if (item.status === 'unread') {
      try { await api.put(`/contact/${item._id || item.id}`, { status: 'read' }) } catch {}
      setItems(its => its.map(it => (it._id || it.id) === (item._id || item.id) ? { ...it, status: 'read' } : it))
    }
  }

  /* ── Save note ── */
  const saveNote = async () => {
    if (!noteModal) return
    const { id } = noteModal
    try { await api.put(`/contact/${id}`, { note: noteText }) } catch {}
    setItems(its => its.map(it => (it._id || it.id) === id ? { ...it, note: noteText } : it))
    setViewing(v => v ? { ...v, note: noteText } : null)
    toast.success('Note saved')
    setNoteModal(null)
    setNoteText('')
  }

  /* ── Delete ── */
  const doDelete = async (id) => {
    try { await api.delete(`/contact/${id}`) } catch {}
    setItems(its => its.filter(it => (it._id || it.id) !== id))
    setViewing(null)
    toast.success('Message deleted')
  }

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Date']
    const escape = v => { const s = (v ?? '').toString().replace(/"/g, '""'); return /[",\n]/.test(s) ? `"${s}"` : s }
    const rows = filtered.map(it => [
      it.name, it.email, it.phone || '', it.subject, it.message,
      it.status, (it.createdAt || '').slice(0, 10),
    ].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('CSV exported')
  }

  return (
    <AdminPage
      title="Contact Messages"
      subtitle="Messages received from the public contact form"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total',   val: counts.total,   icon: FaUsers,        color: 'bg-blue-50 dark:bg-blue-900/20',    ic: 'text-blue-500' },
          { label: 'Unread',  val: counts.unread,  icon: FaEnvelope,     color: 'bg-red-50 dark:bg-red-900/20',      ic: 'text-red-500' },
          { label: 'Read',    val: counts.read,    icon: FaEnvelopeOpen, color: 'bg-gray-50 dark:bg-gray-800/50',    ic: 'text-gray-500' },
          { label: 'Replied', val: counts.replied, icon: FaReply,        color: 'bg-green-50 dark:bg-green-900/20',  ic: 'text-green-500' },
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

      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder="Search by name, email or subject..."
          filters={['All', 'Unread', 'Read', 'Replied']}
          activeFilter={filter}
          onFilter={f => { setFilter(f); setPage(1) }}
        />
        <button onClick={exportCSV} className="btn-outline py-2 px-4 text-sm shrink-0">
          <FaDownload size={12} /> Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={6} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Sender', 'Subject', 'Phone', 'Message', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <FaInbox size={28} className="mx-auto mb-2 opacity-30" />
                      No messages found
                    </td>
                  </tr>
                ) : paged.map((msg, i) => {
                  const id = msg._id || msg.id
                  const st = STATUS_STYLE[msg.status] || STATUS_STYLE.read
                  return (
                    <motion.tr
                      key={id || i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`table-row ${msg.status === 'unread' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      {/* Sender */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0 relative">
                            {(msg.name || 'A')[0].toUpperCase()}
                            {msg.status === 'unread' && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm truncate ${msg.status === 'unread' ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {msg.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{msg.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Subject */}
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <span>{SUBJECT_ICON[msg.subject] || '📩'}</span>
                          <span className="truncate max-w-[120px]">{msg.subject}</span>
                        </span>
                      </td>
                      {/* Phone */}
                      <td className="table-cell text-gray-500 text-sm">
                        {msg.phone ? (
                          <a href={`tel:${msg.phone}`} className="hover:text-primary-500 transition-colors flex items-center gap-1">
                            <FaPhone size={10} />{msg.phone}
                          </a>
                        ) : '—'}
                      </td>
                      {/* Message preview */}
                      <td className="table-cell">
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">{msg.message}</p>
                      </td>
                      {/* Date */}
                      <td className="table-cell">
                        <div className="text-xs text-gray-500">{formatDate(msg.createdAt)}</div>
                        <div className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</div>
                      </td>
                      {/* Status */}
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openView(msg)}
                            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors" title="View message">
                            <FaEye size={12} />
                          </button>
                          <button onClick={() => { setNoteModal({ id }); setNoteText(msg.note || '') }}
                            className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-colors" title="Add note">
                            <FaStickyNote size={12} />
                          </button>
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

      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} label="messages" />

      {/* ── View Message Modal ── */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Contact Message" size="md">
        {viewing && (() => {
          const st = STATUS_STYLE[viewing.status] || STATUS_STYLE.read
          return (
            <div className="space-y-5">
              {/* Sender info */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="w-12 h-12 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {(viewing.name || 'A')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-base">{viewing.name}</div>
                  <a href={`mailto:${viewing.email}`} className="text-sm text-primary-500 hover:underline flex items-center gap-1 mt-0.5">
                    <FaEnvelope size={11} /> {viewing.email}
                  </a>
                  {viewing.phone && (
                    <a href={`tel:${viewing.phone}`} className="text-sm text-gray-500 hover:text-primary-500 flex items-center gap-1 mt-0.5 transition-colors">
                      <FaPhone size={11} /> {viewing.phone}
                    </a>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${st.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              {/* Subject */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{SUBJECT_ICON[viewing.subject] || '📩'}</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Subject</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{viewing.subject}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{formatDate(viewing.createdAt)} · {formatTime(viewing.createdAt)}</span>
              </div>

              {/* Message */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Message</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{viewing.message}</p>
              </div>

              {/* Admin Note */}
              {viewing.note && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <FaStickyNote size={10} /> Admin Note
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{viewing.note}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {/* Reply by email */}
                <a
                  href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(viewing.subject)}&body=Dear ${encodeURIComponent(viewing.name)},%0A%0A`}
                  onClick={() => markStatus(viewing._id || viewing.id, 'replied')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
                >
                  <FaReply size={12} /> Reply via Email
                </a>

                {/* Add / Edit note */}
                <button
                  onClick={() => { setNoteModal({ id: viewing._id || viewing.id }); setNoteText(viewing.note || '') }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <FaStickyNote size={12} /> {viewing.note ? 'Edit Note' : 'Add Note'}
                </button>

                {/* Status toggles */}
                {viewing.status !== 'replied' && (
                  <button onClick={() => markStatus(viewing._id || viewing.id, 'replied')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-700 text-green-600 text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <FaCheckCircle size={12} /> Mark Replied
                  </button>
                )}
                {viewing.status === 'replied' && (
                  <button onClick={() => markStatus(viewing._id || viewing.id, 'read')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <FaEnvelopeOpen size={12} /> Mark Read
                  </button>
                )}

                {/* Delete */}
                <button onClick={() => { setConfirmId(viewing._id || viewing.id); setViewing(null) }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors ml-auto">
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Note Modal ── */}
      <Modal open={!!noteModal} onClose={() => { setNoteModal(null); setNoteText('') }} title="Admin Note" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Internal note — not visible to the sender.</p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
            className="field resize-none"
            placeholder="Write your note here..."
            autoFocus
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
        onConfirm={() => { doDelete(confirmId); setConfirmId(null) }}
        title="Delete Message"
        message="Permanently delete this contact message? This cannot be undone."
      />
    </AdminPage>
  )
}
