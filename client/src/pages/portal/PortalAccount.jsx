import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function PortalAccount() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const profile = useForm({ defaultValues: { name: user?.name || '' } })
  const password = useForm()
  const saveProfile = async data => { setSaving(true); try { const r = await api.put('/users/profile/me', data); updateUser(r.data); toast.success('Profile updated') } catch(e) { toast.error(e.message) } finally { setSaving(false) } }
  const savePassword = async data => { try { await api.put('/auth/change-password', data); password.reset(); toast.success('Password changed') } catch(e) { toast.error(e.message) } }
  return <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-8"><div className="max-w-2xl mx-auto space-y-5">
    <div className="flex items-center justify-between"><div><button onClick={()=>navigate(-1)} className="text-sm text-primary-600 mb-2">← Back</button><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account settings</h1></div><button onClick={logout} className="btn-secondary">Log out</button></div>
    <section className="card p-5"><h2 className="font-bold mb-4">Profile</h2><form onSubmit={profile.handleSubmit(saveProfile)} className="space-y-4"><div><label className="label">Name</label><input {...profile.register('name',{required:'Name is required'})} className="field"/></div><div><label className="label">Email</label><input value={user?.email||''} disabled className="field opacity-60"/></div><button disabled={saving} className="btn-primary">{saving?'Saving…':'Save profile'}</button></form></section>
    <section className="card p-5"><h2 className="font-bold mb-4">Change password</h2><form onSubmit={password.handleSubmit(savePassword)} className="space-y-4"><input {...password.register('currentPassword',{required:true})} type="password" placeholder="Current password" className="field"/><input {...password.register('newPassword',{required:true,minLength:8})} type="password" placeholder="New password (minimum 8 characters)" className="field"/><button className="btn-primary">Change password</button></form></section>
  </div></div>
}
