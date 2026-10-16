import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'
import CarbonTrackLogo from '../components/CarbonTrackLogo.jsx'
import {
  UserCheck,
  ShieldCheck,
  KeyRound,
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from 'lucide-react'

const acceptInviteSchema = yup.object({
  token: yup.string().trim().required('Invite token is required'),
  name: yup.string().trim().min(2, 'Full name must be at least 2 characters').required('Full name is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  agreeTerms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms to activate your seat'),
})

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(acceptInviteSchema),
    defaultValues: {
      token: initialToken,
      name: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true,
    },
  })

  const watchPassword = watch('password', '')

  const getPasswordStrength = () => {
    if (!watchPassword) return 0
    let score = 0
    if (watchPassword.length >= 8) score += 1
    if (/[A-Z]/.test(watchPassword)) score += 1
    if (/[0-9]/.test(watchPassword)) score += 1
    if (/[^A-Za-z0-9]/.test(watchPassword)) score += 1
    return score
  }

  const strength = getPasswordStrength()

  async function onSubmit(data) {
    setServerError('')
    try {
      await api.post('/auth/accept-invite', {
        token: data.token,
        name: data.name,
        password: data.password,
      })
      setSuccessMessage('Invitation accepted successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message ||
          'Failed to accept invitation. The token may be expired or already used.',
      )
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs mb-3.5">
            <CarbonTrackLogo className="h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Organization Invitation • Verified Secure Token</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Join Your Team on CarbonTrack
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You have been invited by an organization administrator to collaborate on GHG emissions accounting.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8">
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5" noValidate>
            {/* Token field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invitation Token *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Paste invite token"
                  className={`w-full pl-10 pr-3.5 py-2 bg-slate-50 border rounded-xl font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-600/10 ${
                    errors.token ? 'border-rose-400' : 'border-slate-200'
                  }`}
                  {...register('token')}
                />
              </div>
              {errors.token && <p className="text-[11px] text-rose-600 mt-1">{errors.token.message}</p>}
            </div>

            {/* Name field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Marcus Thorne"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                    errors.name ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  {...register('name')}
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Create Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                    errors.password ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
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
              {watchPassword && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full ${strength >= 1 ? 'bg-emerald-500 w-1/4' : 'w-0'}`} />
                    <div className={`h-full ${strength >= 2 ? 'bg-emerald-500 w-1/4' : 'w-0'}`} />
                    <div className={`h-full ${strength >= 3 ? 'bg-emerald-500 w-1/4' : 'w-0'}`} />
                    <div className={`h-full ${strength >= 4 ? 'bg-emerald-500 w-1/4' : 'w-0'}`} />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-slate-500">
                    {strength <= 1 && 'Weak'}
                    {strength === 2 && 'Fair'}
                    {strength === 3 && 'Good'}
                    {strength === 4 && 'Strong'}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                    errors.confirmPassword ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-0.5 rounded-sm"
                  {...register('agreeTerms')}
                />
                <span className="text-xs text-slate-600 leading-relaxed select-none">
                  I agree to the CarbonTrack Terms of Service and ESG Audit Logging Standards under ISO 14064-3.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.agreeTerms.message}</p>
              )}
            </div>

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Activating corporate seat…</span>
              ) : (
                <>
                  <span>Accept Invitation & Complete Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Already have an active account?{' '}
            <Link to="/login" className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
