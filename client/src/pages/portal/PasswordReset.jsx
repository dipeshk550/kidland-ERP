import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import LOGO from '../../assets/logo.js'

export default function PasswordReset() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const token = params.get('token')
  const { register, handleSubmit, formState: { errors } } = useForm()
  const submit = async data => {
    setError(''); setMessage('')
    try {
      const response = token
        ? await api.post('/auth/reset-password', { token, newPassword: data.newPassword })
        : await api.post('/auth/forgot-password', { identifier: data.identifier })
      setMessage(response.message || 'Request completed.')
    } catch (e) { setError(e.message || 'Unable to complete password reset') }
  }
  return <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-7 sm:p-9">
      <img src={LOGO} alt="Kidland School" className="w-14 h-14 rounded-2xl object-contain bg-white p-1 shadow mb-5"/>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{token ? 'Set a new password' : 'Forgot password?'}</h1>
      <p className="text-sm text-gray-500 mt-2 mb-6">{token ? 'Choose a new password for your account.' : 'Enter your registered email, mobile number, username, employee ID, or parent ID.'}</p>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        {!token && <div><label className="label">Registered account ID</label><input {...register('identifier', { required: 'Account ID is required' })} className="field" autoComplete="username"/>{errors.identifier && <p className="error-msg">{errors.identifier.message}</p>}</div>}
        {token && <div><label className="label">New password</label><input {...register('newPassword', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} type="password" className="field" autoComplete="new-password"/>{errors.newPassword && <p className="error-msg">{errors.newPassword.message}</p>}</div>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button className="btn-primary w-full justify-center">{token ? 'Reset password' : 'Send reset instructions'}</button>
      </form>
      <div className="flex justify-between mt-6 text-sm"><Link to="/teacher/login" className="text-primary-600">Teacher login</Link><Link to="/parent/login" className="text-primary-600">Parent login</Link></div>
    </div>
  </main>
}
