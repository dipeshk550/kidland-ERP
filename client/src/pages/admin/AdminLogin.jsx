import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaGraduationCap, FaMoon, FaSun, FaArrowLeft } from 'react-icons/fa'
import LOGO from '../../assets/logo.js'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function AdminLogin() {
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const { dark, toggle }      = useTheme()
  const navigate              = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      navigate(user.role === 'teacher' ? '/teacher' : user.role === 'parent' ? '/parent' : user.role === 'student' ? '/lms/courses' : '/admin')
    } catch (e) {
      setError('root', { message: e.message || 'Invalid email or password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2d1a 50%, #0a1628 100%)' }}/>
      <div className="absolute inset-0 bg-dots opacity-20"/>
      {/* Glow blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#54B435' }}/>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#1e3a5f' }}/>

      {/* Theme toggle */}
      <button onClick={toggle}
        className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
        {dark ? <FaSun size={14}/> : <FaMoon size={14}/>}
      </button>

      {/* Back to site */}
      <Link to="/"
        className="absolute top-5 left-5 flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
        <FaArrowLeft size={11}/> Back to Site
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo card */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-400/40 p-2"
          >
            <img src={LOGO} alt="Kidland School" className="w-full h-full object-contain"/>
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kidland School</h1>
          <p className="text-primary-300 text-sm mt-1 font-medium">Admin Management System</p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Card header strip */}
          <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-300 to-primary-500"/>

          <div className="p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to manage Kidland School</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Error banner */}
              {errors.root && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <FaLock size={12} className="shrink-0"/>
                  {errors.root.message}
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                    })}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className={`field pl-11 h-12 ${errors.email ? 'field-error' : ''}`}
                  />
                </div>
                {errors.email && <p className="error-msg mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' }
                    })}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    className={`field pl-11 pr-12 h-12 ${errors.password ? 'field-error' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                    {showPw ? <FaEyeSlash size={15}/> : <FaEye size={15}/>}
                  </button>
                </div>
                {errors.password && <p className="error-msg mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center h-12 text-base mt-2">
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing In...</>
                ) : 'Sign In to Admin Panel'}
              </button>
              <Link to="/forgot-password" className="block text-center text-sm text-primary-600 hover:underline">Forgot password?</Link>
            </form>
          </div>

          {/* Demo credentials
          <div className="px-8 pb-7">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Demo Credentials</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Super Admin</span>
                  <span className="text-xs font-mono text-primary-500">admin@kidland.edu.np / admin123456</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Co Admin</span>
                  <span className="text-xs font-mono text-primary-500">coadmin@kidland.edu.np / coadmin123</span>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Kidland School, Lalitpur. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
