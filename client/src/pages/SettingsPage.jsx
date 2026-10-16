import React, { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Settings,
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  Calendar,
  KeyRound,
  ArrowRight,
  Info,
  Sparkles,
  Lock,
  Globe2,
  Award,
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const orgId = typeof user?.organization === 'object' ? user?.organization?._id : user?.organization

  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orgSuccess, setOrgSuccess] = useState('')

  // Org Profile Form State
  const [orgForm, setOrgForm] = useState({
    name: '',
    baselineYear: 2023,
    industrySector: 'Heavy Manufacturing & Industrial Goods',
  })
  const [savingOrg, setSavingOrg] = useState(false)

  // Invite Form State
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'data_entry',
  })
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [generatedInvite, setGeneratedInvite] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Load Organization
  async function loadOrg() {
    if (!orgId) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/organizations/${orgId}`)
      const o = res.data.data.organization
      setOrg(o)
      setOrgForm({
        name: o.name || '',
        baselineYear: o.baselineYear || 2023,
        industrySector: 'Heavy Manufacturing & Industrial Goods',
      })
    } catch (err) {
      setError('Unable to load organization settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrg()
  }, [orgId])

  // Save Organization Settings
  async function handleSaveOrg(e) {
    e.preventDefault()
    setOrgSuccess('')
    setError('')

    if (!orgForm.name.trim()) {
      setError('Organization name is required')
      return
    }

    setSavingOrg(true)
    try {
      const res = await api.patch(`/organizations/${orgId}`, {
        name: orgForm.name.trim(),
        baselineYear: Number(orgForm.baselineYear),
      })
      setOrg(res.data.data.organization)
      setOrgSuccess('Organization profile and baseline reporting year updated.')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update organization settings.')
    } finally {
      setSavingOrg(false)
    }
  }

  // Send Invitation
  async function handleSendInvite(e) {
    e.preventDefault()
    setInviteError('')
    setGeneratedInvite(null)

    if (!inviteForm.email.trim()) {
      setInviteError('Please enter an invitee email address')
      return
    }

    setInviting(true)
    try {
      const res = await api.post('/auth/invite', {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      })
      setGeneratedInvite(res.data.data.invite)
      setInviteForm({ email: '', role: 'data_entry' })
    } catch (err) {
      setInviteError(err.response?.data?.error?.message || 'Failed to generate invitation.')
    } finally {
      setInviting(false)
    }
  }

  function handleCopyInviteLink() {
    if (!generatedInvite?.token) return
    const inviteUrl = `${window.location.origin}/accept-invite?token=${generatedInvite.token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const roleBadges = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    data_entry: 'bg-blue-50 text-blue-700 border-blue-200',
    viewer: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Settings & Team Management
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Corporate Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate profile, baseline reporting year, and team member permissions.
          </p>
        </div>
      </div>

      {/* ── Feedback Banners ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {orgSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{orgSuccess}</span>
        </div>
      )}

      {/* ── Organization Profile Settings Form ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Organization Profile & Carbon Accounting Baseline
              </h2>
              <p className="text-[11px] text-slate-500">
                Statutory entity information and historical base year reference for emissions accounting.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
            ISO 14064 Entity
          </span>
        </div>

        <form onSubmit={handleSaveOrg} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Org Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Legal Entity Name *
              </label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 disabled:bg-slate-50"
                required
              />
            </div>

            {/* Baseline Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Baseline Reporting Year *
              </label>
              <select
                value={orgForm.baselineYear}
                onChange={(e) => setOrgForm({ ...orgForm, baselineYear: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono disabled:bg-slate-50"
              >
                <option value={2024}>2024 (Current Cycle)</option>
                <option value={2023}>2023 (FY2023 Baseline)</option>
                <option value={2022}>2022 (FY2022 Baseline)</option>
                <option value={2021}>2021 (FY2021 Baseline)</option>
                <option value={2020}>2020 (SBTi 2020 Base)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Sector Classification
              </label>
              <select
                value={orgForm.industrySector}
                onChange={(e) => setOrgForm({ ...orgForm, industrySector: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 disabled:bg-slate-50"
              >
                <option value="Heavy Manufacturing & Industrial Goods">Heavy Manufacturing & Industrial Goods</option>
                <option value="Technology & Software Services">Technology & Software Services</option>
                <option value="Logistics, Freight & Supply Chain">Logistics, Freight & Supply Chain</option>
                <option value="Energy, Utilities & Infrastructure">Energy, Utilities & Infrastructure</option>
                <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decarbonization Target
              </label>
              <input
                type="text"
                value="Net-Zero by 2040 (SBTi 1.5°C Aligned)"
                readOnly
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 outline-none font-mono"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingOrg}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {savingOrg ? 'Saving changes...' : 'Save Organization Settings'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── Team Collaboration & User Management ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Active Team Members Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold font-display text-slate-900">
                  Active Team Members
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Authenticated Users</span>
            </div>

            <div className="space-y-3">
              {/* Current user card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{user?.name} (You)</p>
                      <span className="text-[9px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Active Session
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{user?.email}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    roleBadges[user?.role] || roleBadges.viewer
                  }`}
                >
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              {/* Demo Team Roster Representation */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                    MT
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Marcus Thorne</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">marcus.t@acmeglobal.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                  Data Entry
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
                    SA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sarah Audit (Lead ESG Controller)</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">sarah.audit@pwc-climate.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                  Admin
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>SSO Domain Matching: Active</span>
            <span className="font-mono">Role-Based Access Control</span>
          </div>
        </div>

        {/* Right 5 cols: Invite New Member Form & Token Generator */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold font-display text-slate-900">
                Invite Team Collaborator
              </h2>
            </div>

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Colleague Work Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 disabled:bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Platform Role *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 disabled:bg-slate-50"
                >
                  <option value="data_entry">Data Entry Specialist (Log readings & upload files)</option>
                  <option value="admin">Administrator (Full entity management & governance)</option>
                  <option value="viewer">Auditor / Viewer (Read-only reports & dashboards)</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {inviting ? (
                    <span>Generating Secure Link...</span>
                  ) : (
                    <>
                      <span>Generate Invite Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Generated Invite Token Link Result Box */}
            {generatedInvite && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span>Invite Token Created! (7-day validity)</span>
                  <span className="font-mono text-[10px] uppercase text-emerald-700 font-bold">
                    {generatedInvite.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/accept-invite?token=${generatedInvite.token}`}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-[10px] font-mono text-slate-700 select-all"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shrink-0 text-xs flex items-center gap-1 font-semibold"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" /> Single-use cryptographically signed token
          </div>
        </div>
      </div>
    </div>
  )
}
