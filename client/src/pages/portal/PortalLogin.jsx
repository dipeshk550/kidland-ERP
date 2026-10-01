import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import LOGO from '../../assets/logo.js'

export default function PortalLogin({ role }) {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm()
  const teacher = role === 'teacher'

  const submit = async ({ identifier, password, rememberMe }) => {
    setBusy(true)
    try {
      const user = await login(identifier, password, rememberMe)
      if (user.role !== role) {
        logout()
        throw new Error(`This account is not a ${teacher ? 'teacher' : 'parent'} account.`)
      }
      navigate(teacher ? '/teacher' : '/parent', { replace: true })
    } catch (error) {
      setError('root', { message: error.message || 'Invalid email or password' })
    } finally { setBusy(false) }
  }

  return <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950"/>
    <div className="relative z-10 w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"><FaArrowLeft size={11}/> Back to site</Link>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-300 to-primary-500"/>
        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-4 mb-7">
            <img src={LOGO} alt="Kidland School" className="w-14 h-14 rounded-2xl object-contain bg-white p-1 shadow"/>
            <div><h1 className="text-xl font-bold text-gray-900 dark:text-white">{teacher ? 'Teacher Portal' : 'Parent Portal'}</h1><p className="text-sm text-gray-500">Kidland School</p></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in with the account provided by the school.</p>
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            {errors.root && <div className="rounded-xl bg-red-50 text-red-600 p-3 text-sm">{errors.root.message}</div>}
            <div><label className="label">{teacher ? 'Email, employee ID, or username' : 'Email, mobile number, or parent ID'}</label><div className="relative"><FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14}/><input {...register('identifier',{required:'Login ID is required'})} autoComplete="username" className="field pl-11 h-12"/></div>{errors.identifier&&<p className="error-msg">{errors.identifier.message}</p>}</div>
            <div><label className="label">Password</label><div className="relative"><FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14}/><input {...register('password',{required:'Password is required'})} type={show?'text':'password'} autoComplete="current-password" className="field pl-11 pr-11 h-12"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{show?<FaEyeSlash/>:<FaEye/>}</button></div>{errors.password&&<p className="error-msg">{errors.password.message}</p>}</div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><input type="checkbox" {...register('rememberMe')} defaultChecked/> Remember me</label>
            <button disabled={busy} className="btn-primary w-full justify-center h-12">{busy?'Signing in…':'Sign in to portal'}</button>
            <Link to="/forgot-password" className="block text-center text-sm text-primary-600 hover:underline">Forgot password?</Link>
          </form>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500 mt-5">Accounts are created and managed by Kidland School administrators.</p>
    </div>
  </main>
}
