import { useState, useEffect } from 'react'
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronRight, FaTags } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Confirm, Spinner } from '../../../components/ui/index'

const FREQUENCIES = ['monthly','one-time','quarterly','half-yearly','yearly']
const FREQ_BADGE  = { monthly:'bg-blue-50 text-blue-600 dark:bg-blue-900/20', 'one-time':'bg-gray-100 text-gray-500 dark:bg-gray-800', quarterly:'bg-purple-50 text-purple-600 dark:bg-purple-900/20', 'half-yearly':'bg-indigo-50 text-indigo-600', yearly:'bg-orange-50 text-orange-600' }

/* tiny inline-edit row */
function InlineForm({ groupId, editing, onSave, onCancel }) {
  const [name, setName]       = useState(editing?.name || '')
  const [amount, setAmount]   = useState(editing?.defaultAmount ?? '')
  const [freq, setFreq]       = useState(editing?.frequency || 'monthly')
  const [desc, setDesc]       = useState(editing?.description || '')
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const body = { name: name.trim(), feeGroup: groupId, defaultAmount: Number(amount) || 0, frequency: freq, description: desc }
      if (editing) { await api.put(`/fees/types/${editing._id}`, body) }
      else { await api.post('/fees/types', body) }
      toast.success(editing ? 'Updated' : 'Fee type added!')
      onSave()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="flex gap-2 items-center p-3 bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-700 rounded-xl mx-2 mb-2">
      <input autoFocus className="field text-sm flex-1" placeholder="Fee type name *"
        value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}/>
      <input type="number" min={0} className="field text-sm w-28" placeholder="Amount (Rs.)"
        value={amount} onChange={e => setAmount(e.target.value)}/>
      <select className="field text-sm w-32" value={freq} onChange={e => setFreq(e.target.value)}>
        {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
      </select>
      <input className="field text-sm flex-1" placeholder="Description (optional)"
        value={desc} onChange={e => setDesc(e.target.value)}/>
      <button onClick={save} disabled={saving} className="btn-primary px-3 py-2 text-xs shrink-0">
        {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Save'}
      </button>
      <button onClick={onCancel} className="btn-ghost px-3 py-2 text-xs shrink-0">Cancel</button>
    </div>
  )
}

/* group card */
function GroupCard({ group, types, onReload }) {
  const [open, setOpen]     = useState(true)
  const [adding, setAdding] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [delItem, setDelItem]   = useState(null)

  const handleDelete = async () => {
    try { await api.delete(`/fees/types/${delItem._id}`); toast.success('Deleted'); setDelItem(null); onReload() }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="card overflow-hidden mb-3">
      {/* Group header */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          {open ? <FaChevronDown size={11} className="text-gray-400"/> : <FaChevronRight size={11} className="text-gray-400"/>}
          <span className="font-bold text-gray-800 dark:text-gray-100">{group.name}</span>
          <span className="badge badge-gray text-[10px]">{types.length} type{types.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setAdding(true); setEditItem(null); setOpen(true) }}
          className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          <FaPlus size={10}/> Add
        </button>
      </button>

      {open && (
        <div className="py-1">
          {types.length === 0 && !adding && (
            <div className="text-center py-5 text-sm text-gray-400">
              No fee types yet. <button onClick={() => setAdding(true)} className="text-primary-500 hover:underline font-semibold">Add one</button>
            </div>
          )}

          {types.map(t => (
            editItem?._id === t._id ? (
              <InlineForm key={t._id} groupId={group._id} editing={t}
                onSave={() => { setEditItem(null); onReload() }} onCancel={() => setEditItem(null)}/>
            ) : (
              <div key={t._id}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-50 dark:border-gray-800/40 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary-300 shrink-0"/>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{t.name}</span>
                  {t.description && <span className="text-xs text-gray-400 ml-2">{t.description}</span>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${FREQ_BADGE[t.frequency] || 'bg-gray-100 text-gray-500'}`}>
                  {t.frequency}
                </span>
                {t.defaultAmount > 0 && (
                  <span className="font-mono text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
                    Rs. {Number(t.defaultAmount).toLocaleString()}
                  </span>
                )}
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditItem(t); setAdding(false) }}
                    className="text-primary-400 hover:text-primary-600 transition-colors"><FaEdit size={13}/></button>
                  <button onClick={() => setDelItem(t)}
                    className="text-red-300 hover:text-red-500 transition-colors"><FaTrash size={13}/></button>
                </div>
              </div>
            )
          ))}

          {adding && (
            <InlineForm groupId={group._id} editing={null}
              onSave={() => { setAdding(false); onReload() }} onCancel={() => setAdding(false)}/>
          )}
        </div>
      )}

      <Confirm open={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete}
        title="Delete Fee Type" message={`Delete "${delItem?.name}"? This cannot be undone.`}/>
    </div>
  )
}

/* ══ Main ══ */
export default function FeeTypes() {
  const [groups, setGroups]     = useState([])
  const [types, setTypes]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [newGroup, setNewGroup] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [g, t] = await Promise.all([
        api.get('/fees/groups?limit=100&status=active'),
        api.get('/fees/types?limit=500'),
      ])
      setGroups(g.data || [])
      setTypes(t.data || [])
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const saveGroup = async () => {
    if (!newGroup.trim()) return toast.error('Group name required')
    setSavingGroup(true)
    try { await api.post('/fees/groups', { name: newGroup.trim(), status: 'active' }); toast.success('Category created!'); setNewGroup(''); setAddingGroup(false); load() }
    catch (e) { toast.error(e.message) } finally { setSavingGroup(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner/></div>

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
            <FaTags size={15} className="text-teal-500"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Types</h1>
            <p className="text-xs text-gray-400">Manage fee categories and their types</p>
          </div>
        </div>
        <button onClick={() => setAddingGroup(p => !p)} className="btn-primary">
          <FaPlus size={12}/> New Category
        </button>
      </div>

      {/* Quick guide */}
      <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">📋 How to set up fees:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-600 dark:text-blue-400">
          <li>Create a <b>Category</b> (e.g. "Transportation", "Academic Fees", "Hostel")</li>
          <li>Add <b>Fee Types</b> inside each category (e.g. Bus Fee, Van Fee)</li>
          <li>Go to <b>Fee Master</b> → select a class → assign amounts per fee type</li>
          <li>Now when you collect fees, those fees appear automatically for that class</li>
        </ol>
      </div>

      {/* New Group inline form */}
      {addingGroup && (
        <div className="flex gap-2 mb-3 p-4 card border-2 border-primary-200 dark:border-primary-700">
          <input autoFocus className="field flex-1" placeholder="Category name (e.g. Transportation, Hostel, Academic Fees…)"
            value={newGroup} onChange={e => setNewGroup(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveGroup()}/>
          <button onClick={saveGroup} disabled={savingGroup} className="btn-primary px-4">
            {savingGroup ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Create'}
          </button>
          <button onClick={() => setAddingGroup(false)} className="btn-ghost px-3">Cancel</button>
        </div>
      )}

      {/* Preset categories quick-add */}
      {groups.length === 0 && !addingGroup && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Quick start — add common categories:</p>
          <div className="flex flex-wrap gap-2">
            {['Academic Fees','Transportation','Hostel & Meals','Computer Lab','Sports & Activities','Examination','Miscellaneous'].map(name => (
              <button key={name} onClick={async () => {
                try { await api.post('/fees/groups', { name, status: 'active' }); load() }
                catch (e) { toast.error(e.message) }
              }} className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Groups with their types */}
      {groups.length === 0 && !loading && !addingGroup && (
        <div className="text-center py-10 text-gray-400">
          <p className="font-semibold">No categories yet</p>
          <p className="text-xs mt-1">Click "New Category" to get started</p>
        </div>
      )}

      {groups.map(group => (
        <GroupCard
          key={group._id}
          group={group}
          types={types.filter(t => (t.feeGroup?._id || t.feeGroup) === group._id)}
          onReload={load}
        />
      ))}
    </div>
  )
}
