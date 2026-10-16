import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { fetchDashboardData } from '../services/reportService.js'
import { scopeColors, sourceTypeColors } from '../components/charts/chartColors.js'
import { ChartSkeleton, ChartEmptyState } from '../components/charts/ChartStates.jsx'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  Building2,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Maximize2,
  Users,
  Activity,
  ShieldCheck,
  Calendar,
  Flame,
  Zap,
  Leaf,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[140px]">
        <p className="font-semibold text-slate-300 mb-1 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 my-0.5">
            <span className="text-slate-400 capitalize">{item.name}:</span>
            <span className="font-mono font-semibold text-white">
              {Number(item.value).toLocaleString('en-US', { maximumFractionDigits: 2 })} tCO₂e
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function FacilityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState({
    trend: [],
    byScope: [],
    byType: [],
    summary: null,
  })
  const [recentRecords, setRecentRecords] = useState([])

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    floorAreaSqM: '',
    headcount: '',
  })

  async function loadFacilityData() {
    setLoading(true)
    setError('')
    try {
      const [facRes, analyticsRes, recordsRes] = await Promise.all([
        api.get('/facilities'),
        fetchDashboardData({ facilityId: id }),
        api.get('/consumption', { params: { facilityId: id, limit: 10 } }),
      ])

      const fac = (facRes.data.data.facilities || []).find((f) => f._id === id)
      if (!fac) {
        setError('Facility not found or access denied.')
        return
      }

      setFacility(fac)
      setEditForm({
        name: fac.name,
        location: fac.location || '',
        floorAreaSqM: fac.floorAreaSqM || '',
        headcount: fac.headcount || '',
      })
      setAnalytics(analyticsRes)
      setRecentRecords(recordsRes.data.data.records || [])
    } catch (err) {
      setError('Unable to load facility telemetry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFacilityData()
  }, [id])

  async function handleUpdateFacility(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/facilities/${id}`, {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        floorAreaSqM: editForm.floorAreaSqM ? Number(editForm.floorAreaSqM) : null,
        headcount: editForm.headcount ? Number(editForm.headcount) : null,
      })
      setShowEditModal(false)
      await loadFacilityData()
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update facility.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteFacility() {
    if (
      !confirm(
        `Are you sure you want to delete ${facility?.name}? Facilities with active consumption records cannot be deleted.`,
      )
    ) {
      return
    }

    try {
      await api.delete(`/facilities/${id}`)
      navigate('/facilities')
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete facility.')
    }
  }

  const totalEmissions = analytics.summary?.totalCO2e || 0
  const areaIntensity = facility?.floorAreaSqM
    ? ((totalEmissions * 1000) / facility.floorAreaSqM).toFixed(1)
    : null
  const headcountIntensity = facility?.headcount
    ? (totalEmissions / facility.headcount).toFixed(2)
    : null

  const s1 = analytics.byScope.find((s) => s.scope === 'Scope 1' || s.scope === 1)?.co2e || 0
  const s2 = analytics.byScope.find((s) => s.scope === 'Scope 2' || s.scope === 2)?.co2e || 0
  const s3 = analytics.byScope.find((s) => s.scope === 'Scope 3' || s.scope === 3)?.co2e || 0

  const trendData = analytics.trend.map((t) => ({
    name: t.month,
    emissions: Number((t.co2e / 1000).toFixed(2)) || Number(t.co2e.toFixed(2)),
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">{error || 'Facility not found'}</h2>
        <Link to="/facilities" className="text-xs font-semibold text-emerald-700 hover:underline">
          ← Return to Facilities Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-7 pb-12">
      {/* ── Breadcrumb & Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/facilities" className="hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Facilities
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-semibold text-slate-900">{facility.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleDeleteFacility}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold text-rose-700 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* ── Facility Hero Header ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">
                {facility.name}
              </h1>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active Facility
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {facility.location || 'Location Not Specified'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                {facility.floorAreaSqM ? `${facility.floorAreaSqM.toLocaleString()} m²` : 'Unspecified Area'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {facility.headcount ? `${facility.headcount.toLocaleString()} Employees` : 'Unspecified Headcount'}
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/consumption"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0 self-start md:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Log Activity
        </Link>
      </div>

      {/* ── Key Telemetry Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emissions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Facility Footprint
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-900">
              {totalEmissions.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="font-mono text-xs text-slate-500">tCO₂e</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Total verified output</p>
        </div>

        {/* Floor Area Intensity */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
            Area Intensity
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-900">
              {areaIntensity || '—'}
            </span>
            <span className="font-mono text-xs text-slate-500">kg CO₂e / m²</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-700 font-medium">Square meter normalized</p>
        </div>

        {/* Employee Intensity */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Personnel Intensity
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-900">
              {headcountIntensity || '—'}
            </span>
            <span className="font-mono text-xs text-slate-500">tCO₂e / person</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Headcount carbon ratio</p>
        </div>

        {/* Scope Breakdown Mini Strip */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Scope Composition
          </span>
          <div className="space-y-1 mt-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 font-semibold">Scope 1:</span>
              <span className="font-mono">{s1.toFixed(1)} t</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-semibold">Scope 2:</span>
              <span className="font-mono">{s2.toFixed(1)} t</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 font-semibold">Scope 3:</span>
              <span className="font-mono">{s3.toFixed(1)} t</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Visualizations ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trajectory */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <h2 className="text-sm font-bold font-display text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Monthly Facility Emissions Output (tCO₂e)
          </h2>
          {trendData.length === 0 ? (
            <ChartEmptyState message="No monthly trend records logged for this facility" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="facGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    name="Facility Output"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#facGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <h2 className="text-sm font-bold font-display text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Source Activity Ratio
          </h2>
          {analytics.byType.length === 0 ? (
            <ChartEmptyState message="No source records logged" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byType} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="type"
                    type="category"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.replace('_', ' ')}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="co2e" name="Output" radius={[0, 4, 4, 0]}>
                    {analytics.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={sourceTypeColors[entry.type] || '#059669'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Consumption Activity Table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900">
              Recent Consumption Logs for {facility.name}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Meter readings, fuel receipts, and batch uploads mapped to this facility.
            </p>
          </div>
          <Link
            to="/consumption"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View Full Ledger →
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No consumption entries logged for this facility yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Activity Type</th>
                  <th className="pb-2 font-semibold">Scope</th>
                  <th className="pb-2 font-semibold">Consumption</th>
                  <th className="pb-2 font-semibold text-right">Calculated CO₂e</th>
                  <th className="pb-2 font-semibold text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 font-mono text-slate-600">
                      {new Date(r.date).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800 capitalize">
                      {r.type.replace('_', ' ')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          r.scope === 1
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : r.scope === 2
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        Scope {r.scope}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-700">
                      {r.amount.toLocaleString()} {r.unit}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-900 text-right">
                      {(r.calculatedCO2e / 1000).toFixed(3)} tCO₂e
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.verificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.verificationStatus === 'estimated'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.verificationStatus === 'verified' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-slate-400" />
                        )}
                        {r.verificationStatus || 'unverified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Facility Modal ──────────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-sm text-slate-900">Edit Facility Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / City & Country
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor Area (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.floorAreaSqM}
                    onChange={(e) => setEditForm({ ...editForm, floorAreaSqM: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headcount (Staff)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.headcount}
                    onChange={(e) => setEditForm({ ...editForm, headcount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
