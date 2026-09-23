import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// ── Validation schemas ────────────────────────────────────────────────────────

const loginSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const signupSchema = yup.object({
  name: yup.string().trim().min(1).required('Name is required'),
  organizationName: yup.string().trim().min(1).required('Organization name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
})

// ── Shared field component ────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Input({ error, ...props }) {
  return (
    <input
      className={`rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
        error ? 'border-red-400' : 'border-slate-300'
      }`}
      {...props}
    />
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }) {
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(loginSchema) })

  async function onSubmit(data) {
    setServerError('')
    try {
      await login(data)
      onSuccess()
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" error={errors.email} {...register('email')} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input type="password" error={errors.password} {...register('password')} />
      </Field>
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

// ── Signup form ───────────────────────────────────────────────────────────────

function SignupForm({ onSuccess }) {
  const { signup } = useAuth()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(signupSchema) })

  async function onSubmit(data) {
    setServerError('')
    try {
      await signup({ ...data, role: 'admin' })
      onSuccess()
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Signup failed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label="Your name" error={errors.name?.message}>
        <Input type="text" error={errors.name} {...register('name')} />
      </Field>
      <Field label="Organization name" error={errors.organizationName?.message}>
        <Input type="text" error={errors.organizationName} {...register('organizationName')} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" error={errors.email} {...register('email')} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input type="password" error={errors.password} {...register('password')} />
      </Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message}>
        <Input type="password" error={errors.confirmPassword} {...register('confirmPassword')} />
      </Field>
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  function onSuccess() {
    navigate(from, { replace: true })
  }

  const tabClass = (t) =>
    `flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-emerald-700 text-emerald-800'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    }`

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-800">
          Carbon Tracker
        </h1>

        {/* Tabs */}
        <div className="mb-6 flex">
          <button className={tabClass('login')} onClick={() => setTab('login')}>
            Sign in
          </button>
          <button className={tabClass('signup')} onClick={() => setTab('signup')}>
            Create account
          </button>
        </div>

        {tab === 'login' ? (
          <LoginForm onSuccess={onSuccess} />
        ) : (
          <SignupForm onSuccess={onSuccess} />
        )}
      </div>
    </div>
  )
}
