import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FaShieldAlt, FaUserShield, FaEdit, FaTrash, FaSpinner, FaKey } from 'react-icons/fa'
import { Badge, Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const PER = 8

export default function ManageUsers() {
  const { isSuperAdmin } = useAuth()
  const [items,    setItems]    = useState([])       // Start EMPTY — no dummy data
  const [loading,  setLoading]  = useState(true)     // Show spinner while fetching
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [confirmId,setConfirmId]= useState(null)
  const [accessUser,setAccessUser]=useState(null)
  const [catalog,setCatalog]=useState([])
  const [overrides,setOverrides]=useState([])
  const [roles,setRoles]=useState([])
  const [passwordUser,setPasswordUser]=useState(null)
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [passwordSaving,setPasswordSaving]=useState(false)
  const [customRole,setCustomRole]=useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Load users from backend — show real data only
  useEffect(() => {
    setLoading(true); setError(null)
    api.get('/users')
      .then(r => {
        const users = r?.data || r || []
        setItems(Array.isArray(users) ? users : [])
      })
      .catch(err => {
        setError('Could not load users. Make sure the backend server is running.')
        console.error('Users fetch error:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it =>
    (it.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (it.email||'').toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice((page-1)*PER, page*PER)

  const openAdd = () => {
    setEditing(null)
    reset({ name:'', email:'', username:'', employeeId:'', phone:'', parentId:'', password:'', role:'coadmin', status:'active' })
    setModal(true)
  }
  const openEdit = (item) => {
    setEditing(item)
    reset({ name:item.name||'', email:item.email||'', username:item.username||'', employeeId:item.employeeId||'', phone:item.phone||'', parentId:item.parentId||'', role:item.role||'coadmin', status:item.isActive!==false?'active':'inactive' })
    setModal(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        const r = await api.put(`/users/${editing._id||editing.id}`, data)
        const updated = r?.data || { ...editing, ...data }
        setItems(its => its.map(it => (it._id||it.id)===(editing._id||editing.id) ? { ...it, ...updated } : it))
        toast.success('User updated successfully')
      } else {
        const r = await api.post('/users', data)
        const newUser = r?.data || { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() }
        setItems(its => [newUser, ...its])
        toast.success('User created. Send them their credentials.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save user')
      return
    }
    setModal(false); reset()
  }

  const onDelete = async (id) => {
    const target = items.find(it => (it._id||it.id) === id)
    if (target?.role === 'superadmin') { toast.error('Cannot delete Super Admin'); return }
    try {
      await api.delete(`/users/${id}`)
      setItems(its => its.filter(it => (it._id||it.id) !== id))
      toast.success('User removed')
    } catch (err) {
      toast.error(err.message || 'Failed to delete user')
    }
  }

  const openAccess = async (row) => {
    try {
      const [catalogResponse, rolesResponse] = await Promise.all([
        api.get('/rbac/catalog'),
        api.get('/rbac/roles'),
      ])
      setCatalog(catalogResponse.data || [])
      setRoles(rolesResponse.data || [])
      setAccessUser(row)
      setCustomRole(row.customRole?._id || row.customRole || '')
      setOverrides(row.permissionOverrides || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load permissions')
    }
  }

  const toggleAccess = (module, action) => setOverrides(old => {
    const found = old.findIndex(p => p.module === module && p.action === action)
    if (found < 0) return [...old, { module, action, allowed: true }]
    if (old[found].allowed === true) return old.map((p, i) => i === found ? { ...p, allowed: false } : p)
    return old.filter((_, i) => i !== found)
  })

  const saveAccess = async () => {
    if (!accessUser) return
    try {
      const r = await api.put(`/rbac/users/${accessUser._id || accessUser.id}/access`, {
        customRole: customRole || null,
        permissionOverrides: overrides,
      })
      setItems(xs => xs.map(x => (x._id || x.id) === (accessUser._id || accessUser.id)
        ? { ...x, ...r.data }
        : x))
      setAccessUser(null)
      toast.success('User access updated')
    } catch (e) {
      toast.error(e.message || 'Failed to save permissions')
    }
  }

  const saveAdminPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setPasswordSaving(true)
    try {
      await api.put(`/users/${passwordUser._id || passwordUser.id}/password`, { newPassword })
      toast.success('Password reset successfully')
      setPasswordUser(null); setNewPassword(''); setConfirmPassword('')
    } catch (err) { toast.error(err.message || 'Unable to reset password') }
    finally { setPasswordSaving(false) }
  }

  return (
    <AdminPage title="User Management" subtitle="Manage admin accounts and role-based permissions" onAdd={openAdd} addLabel="Add User">

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <FaShieldAlt size={14} className="mt-0.5 shrink-0"/>
        <span>
          <strong>Super Admin</strong> has full access including user management.{' '}
          <strong>Co Admin</strong> can manage content but cannot access this page.
        </span>
      </div>

      <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search users by name or email..."/>

      {/* States */}
      {loading && (
        <div className="card flex items-center justify-center py-20 gap-3 text-gray-500 dark:text-gray-400">
          <FaSpinner className="animate-spin text-primary-400" size={22}/>
          <span className="text-sm">Loading users from server...</span>
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="text-red-400" size={22}/>
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Could not connect to server</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
          <button onClick={() => { setLoading(true); setError(null); api.get('/users').then(r => setItems(r?.data||r||[])).catch(e => setError(e.message)).finally(() => setLoading(false)) }}
            className="btn-primary mx-auto">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    {['Name','Role','Status','Last Login','Actions'].map(h => <th key={h} className="table-head">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-400">
                        {items.length === 0 ? 'No users found. Add your first admin user.' : 'No users match your search.'}
                      </td>
                    </tr>
                  ) : paged.map((row, i) => (
                    <motion.tr key={row._id||row.id||i}
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
                      className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm shrink-0">
                            {(row.name||'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.name}</div>
                            <div className="text-xs text-gray-400">{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge gap-1 ${row.role==='superadmin'?'badge-blue':'badge-green'}`}>
                          {row.role==='superadmin' ? <FaShieldAlt size={9}/> : <FaUserShield size={9}/>}
                          {{superadmin:'Super Admin',admin:'Admin',coadmin:'Co Admin',teacher:'Teacher',staff:'Staff',student:'Student',parent:'Parent'}[row.role] || row.role}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Badge status={row.isActive!==false ? 'active' : 'inactive'}/>
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'Never'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(row)}
                            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                            <FaEdit size={12}/>
                          </button>
                          <button onClick={() => openAccess(row)} title="Permission overrides"
                            className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center hover:bg-purple-100 transition-colors">
                            <FaShieldAlt size={12}/>
                          </button>
                          <button onClick={() => setPasswordUser(row)} title="Reset password"
                            className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors">
                            <FaKey size={12}/>
                          </button>
                          {row.role !== 'superadmin' && (
                            <button onClick={() => setConfirmId(row._id||row.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                              <FaTrash size={12}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); reset() }} title={editing ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register('name', { required: 'Name is required' })} className={`field ${errors.name?'field-error':''}`} placeholder="Full name"/>
            {errors.name && <p className="error-msg">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email Address *</label>
            <input type="email" {...register('email', { required: 'Email is required', pattern: { value:/\S+@\S+\.\S+/, message:'Invalid email' } })} className={`field ${errors.email?'field-error':''}`} placeholder="user@kidland.edu.np"/>
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Username</label><input {...register('username')} className="field" placeholder="Optional login username"/></div>
            <div><label className="label">Phone / mobile</label><input {...register('phone')} className="field" placeholder="Optional mobile number"/></div>
            <div><label className="label">Employee ID (teachers/staff)</label><input {...register('employeeId')} className="field" placeholder="e.g. TCH-001"/></div>
            <div><label className="label">Parent ID (parents)</label><input {...register('parentId')} className="field" placeholder="e.g. PAR-001"/></div>
          </div>
          {!editing && (
            <div>
              <label className="label">Password *</label>
              <input type="password" {...register('password', { required: 'Password is required', minLength: { value:8, message:'Minimum 8 characters' } })} className={`field ${errors.password?'field-error':''}`} placeholder="Minimum 8 characters"/>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select {...register('role')} className="field">
                <option value="coadmin">Co Admin</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Grade / class (students)</label>
            <input {...register('grade')} className="field" placeholder="e.g. Grade 5"/>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <strong className="text-gray-700 dark:text-gray-300">Permissions:</strong><br/>
            Super Admin — full access including user management and security settings.<br/>
            Co Admin — can manage news, events, gallery, notices, teachers and admissions.<br/>
            Teacher — can manage assigned LMS courses and learning activities.<br/>
            Student — can access enrolled learning content.<br/>
            Parent — can view linked student learning progress.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!passwordUser} onClose={() => { setPasswordUser(null); setNewPassword(''); setConfirmPassword('') }} title={`Reset password — ${passwordUser?.name || ''}`}>
        <form onSubmit={saveAdminPassword} className="space-y-4">
          <p className="text-sm text-gray-500">Set a new password for this account. Existing sessions will be signed out.</p>
          <div><label className="label">New password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="field" minLength={8} autoComplete="new-password" required /></div>
          <div><label className="label">Confirm new password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="field" minLength={8} autoComplete="new-password" required /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setPasswordUser(null)} className="btn-ghost">Cancel</button><button type="submit" disabled={passwordSaving} className="btn-primary">{passwordSaving ? 'Saving…' : 'Reset password'}</button></div>
        </form>
      </Modal>

      <Modal open={!!accessUser} onClose={() => setAccessUser(null)} title={`Permission overrides — ${accessUser?.name || ''}`}>
        <div className="max-h-[55vh] overflow-y-auto space-y-3">
          <p className="text-xs text-gray-500">Each action cycles through <strong>inherit</strong>, <strong>allow</strong>, and <strong>deny</strong>. Overrides take precedence over the assigned role.</p>
          <div><label className="label">Assigned custom role</label><select className="field" value={customRole} onChange={e => setCustomRole(e.target.value)}><option value="">No custom role (legacy defaults)</option>{roles.filter(r => r.isActive).map(r => <option value={r._id} key={r._id}>{r.label}</option>)}</select></div>
          {catalog.map(c => <div key={c.module} className="border-b pb-2">
            <div className="font-semibold text-sm capitalize mb-1">{c.module}</div>
            <div className="flex flex-wrap gap-3">{c.actions.map(a => {
              const item = overrides.find(x => x.module === c.module && x.action === a)
              const state = item ? (item.allowed ? 'allow' : 'deny') : 'inherit'
              return <button type="button" key={a} onClick={() => toggleAccess(c.module,a)} className={`text-xs px-2 py-1 rounded border ${state==='allow'?'bg-green-50 border-green-300 text-green-700':state==='deny'?'bg-red-50 border-red-300 text-red-700':'bg-gray-50 border-gray-200 text-gray-500'}`}>{a}: {state}</button>
            })}</div>
          </div>)}
        </div>
        <div className="flex justify-end gap-3 pt-4"><button className="btn-ghost" onClick={() => setAccessUser(null)}>Cancel</button><button className="btn-primary" onClick={saveAccess}>Save access</button></div>
      </Modal>

      <Confirm
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => onDelete(confirmId)}
        title="Remove User"
        message="Are you sure you want to remove this user? This cannot be undone."
      />
    </AdminPage>
  )
}
