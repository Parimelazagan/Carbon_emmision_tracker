import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CarbonTrackLogo from '../components/CarbonTrackLogo.jsx'
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Building2 } from 'lucide-react'

const loginSchema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Corporate email is required'),
  password: yup.string().required('Password is required'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data) {
    setServerError('')
    try {
      await login(data)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Authentication failed. Please verify your credentials.',
      )
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Top Centered Brand Box */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs mb-4">
            <CarbonTrackLogo className="h-9" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Sign In to CarbonTrack
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Access your corporate emissions dashboard, audit trails, and ESG compliance reports.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8">
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5" noValidate>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your organization administrator to reset your credentials.') }} className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                    errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 rounded-sm"
                />
                <span className="text-xs text-slate-600 select-none">Remember this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Authenticating session…</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Need to register a new entity?{' '}
            <Link to="/signup" className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2">
              Register Organization
            </Link>
          </p>

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ISO 14064-3
            </span>
            <span>•</span>
            <span>256-Bit TLS</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
          </div>
        </div>
      </div>
    </div>
  )
}
