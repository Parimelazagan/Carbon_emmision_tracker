import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CarbonTrackLogo from '../components/CarbonTrackLogo.jsx'
import {
  Building2,
  User,
  Mail,
  Lock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

const signupSchema = yup.object({
  organizationName: yup
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .required('Organization name is required'),
  baselineYear: yup
    .number()
    .typeError('Select a valid year')
    .min(2000, 'Baseline year must be 2000 or later')
    .max(new Date().getFullYear(), 'Baseline year cannot be in the future')
    .required('Baseline reporting year is required'),
  name: yup
    .string()
    .trim()
    .min(2, 'Legal name must be at least 2 characters')
    .required('Primary administrator name is required'),
  email: yup
    .string()
    .email('Enter a valid corporate email')
    .required('Work email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
  agreeTerms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms of service to proceed'),
})

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      organizationName: '',
      baselineYear: 2023,
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true,
    },
  })

  const watchPassword = watch('password', '')

  // Simple password strength calculation
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
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        organizationName: data.organizationName,
        role: 'admin',
      })
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message ||
          'Organization registration failed. Please review your entries.',
      )
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs mb-4">
            <CarbonTrackLogo className="h-9" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Register Your Organization
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Set up your corporate boundary, baseline accounting year, and primary administrator workspace.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-9">
          {serverError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Section 1: Organization Details */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-800">
                  1. Organization Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Global Manufacturing Ltd."
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                      errors.organizationName
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    {...register('organizationName')}
                  />
                  {errors.organizationName && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.organizationName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Baseline Year *
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10"
                      {...register('baselineYear')}
                    >
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                      <option value={2022}>2022</option>
                      <option value={2021}>2021</option>
                      <option value={2020}>2020</option>
                      <option value={2019}>2019</option>
                    </select>
                  </div>
                  {errors.baselineYear && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.baselineYear.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Primary Administrator */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-slate-100">
                <User className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-800">
                  2. Primary Administrator (CSO / Lead Auditor)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Dr. Elena Vance"
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                        errors.name
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      {...register('name')}
                    />
                  </div>
                  {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="elena.vance@company.com"
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                        errors.email
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className={`w-full pl-3.5 pr-9 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                        errors.password
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {watchPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                        <div
                          className={`h-full ${
                            strength >= 1 ? 'bg-emerald-500 w-1/4' : 'w-0'
                          }`}
                        />
                        <div
                          className={`h-full ${
                            strength >= 2 ? 'bg-emerald-500 w-1/4' : 'w-0'
                          }`}
                        />
                        <div
                          className={`h-full ${
                            strength >= 3 ? 'bg-emerald-500 w-1/4' : 'w-0'
                          }`}
                        />
                        <div
                          className={`h-full ${
                            strength >= 4 ? 'bg-emerald-500 w-1/4' : 'w-0'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-medium text-slate-500">
                        {strength <= 1 && 'Weak'}
                        {strength === 2 && 'Fair'}
                        {strength === 3 && 'Good'}
                        {strength === 4 && 'Strong'}
                      </span>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10 ${
                      errors.confirmPassword
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-0.5 rounded-sm"
                  {...register('agreeTerms')}
                />
                <span className="text-xs text-slate-600 leading-relaxed select-none">
                  I agree to CarbonTrack’s Terms of Service and ESG Audit Logging Standards under ISO 14064-1.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.agreeTerms.message}</p>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Provisioning organization workspace…</span>
              ) : (
                <>
                  <span>Create Organization & Launch Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Already have an active corporate account?{' '}
            <Link to="/login" className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
