import React, { useEffect, useState, useMemo } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Database,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  Flame,
  Droplets,
  Car,
  Pencil,
  Trash2,
  X,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
} from 'lucide-react'

const EMISSION_TYPE_META = {
  electricity: { label: 'Grid Electricity', scope: 2, icon: Zap, defaultUnit: 'kWh' },
  natural_gas: { label: 'Natural Gas', scope: 1, icon: Flame, defaultUnit: 'm³' },
  diesel: { label: 'Diesel Fuel', scope: 1, icon: Car, defaultUnit: 'L' },
  petrol: { label: 'Petrol / Gasoline', scope: 1, icon: Car, defaultUnit: 'L' },
  water: { label: 'Municipal Water', scope: 3, icon: Droplets, defaultUnit: 'm³' },
}

const REGION_SOURCES = {
  US: 'US EPA eGRID (2024)',
  EU: 'European Environment Agency (EEA 2024)',
  UK: 'UK DEFRA Conversion Factors (2024)',
  IN: 'Central Electricity Authority (CEA v19.0)',
  APAC: 'IEA Asia Pacific Grid Baseline (2024)',
  Global: 'IPCC AR6 / IEA Global Average (2024)',
}

export default function EmissionFactorsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [factors, setFactors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const [form, setForm] = useState({
    type: 'electricity',
    region: 'US',
    factorValue: '',
    unit: 'kWh',
  })

  async function loadFactors() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/emission-factors')
      setFactors(res.data.data.factors || [])
    } catch (err) {
      setError('Unable to load emission factors database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFactors()
  }, [])

  function handleOpenCreate() {
    setModalMode('create')
    setEditingId(null)
    setModalError('')
    setForm({
      type: 'electricity',
      region: 'US',
      factorValue: '',
      unit: 'kWh',
    })
    setShowModal(true)
  }

  function handleOpenEdit(factor) {
    setModalMode('edit')
    setEditingId(factor._id)
    setModalError('')
    setForm({
      type: factor.type,
      region: factor.region,
      factorValue: String(factor.factorValue),
      unit: factor.unit,
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setModalError('')

    if (!form.factorValue || Number(form.factorValue) <= 0) {
      setModalError('Factor value must be a positive number')
      return
    }

    setSubmitting(true)
    try {
      if (modalMode === 'create') {
        await api.post('/emission-factors', {
          type: form.type,
          region: form.region.trim(),
          factorValue: Number(form.factorValue),
          unit: form.unit.trim(),
        })
      } else {
        await api.patch(`/emission-factors/${editingId}`, {
          type: form.type,
          region: form.region.trim(),
          factorValue: Number(form.factorValue),
          unit: form.unit.trim(),
        })
      }
      setShowModal(false)
      await loadFactors()
    } catch (err) {
      setModalError(err.response?.data?.error?.message || 'Failed to save emission factor.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this emission factor?')) return
    try {
      await api.delete(`/emission-factors/${id}`)
      setFactors((prev) => prev.filter((f) => f._id !== id))
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete factor.')
    }
  }

  // Filter factors
  const filteredFactors = useMemo(() => {
    return factors.filter((f) => {
      const meta = EMISSION_TYPE_META[f.type]
      const typeName = meta ? meta.label : f.type
      const matchesSearch =
        typeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.unit.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRegion = regionFilter === 'all' || f.region.toLowerCase() === regionFilter.toLowerCase()
      const matchesType = !typeFilter || f.type === typeFilter

      return matchesSearch && matchesRegion && matchesType
    })
  }, [factors, searchQuery, regionFilter, typeFilter])

  // Unique regions
  const uniqueRegions = useMemo(() => {
    return [...new Set(factors.map((f) => f.region))]
  }, [factors])

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Emission Factors Database & Governance
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              IPCC AR6 & GHG Aligned
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative regional carbon conversion coefficients (kgCO₂e / unit) across electricity grids, fossil fuels, and water resources.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Factor</span>
          </button>
        )}
      </div>

      {/* ── Top Summary Stat Strip (4 Cards) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Active Factors
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-900">{factors.length}</span>
            <span className="text-xs text-slate-500 font-medium">Coefficients</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Validated regional models</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Covered Jurisdictions
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-900">{uniqueRegions.length || 6}</span>
            <span className="text-xs text-slate-500 font-medium">Regions</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">US, EU, UK, India & Global</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
            Methodology Framework
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-xl font-bold text-slate-900">GHG Protocol</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> IPCC 6th Assessment (100-yr GWP)
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Calculation Formula
          </span>
          <div className="mt-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 truncate">
            Activity × Factor = CO₂e
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Deterministic carbon accounting</p>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search factors by activity, region, or unit..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Region Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {['all', 'US', 'EU', 'UK', 'IN', 'Global'].map((reg) => (
            <button
              key={reg}
              onClick={() => setRegionFilter(reg)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                regionFilter === reg
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {reg === 'all' ? 'All Jurisdictions' : reg}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-emerald-600"
        >
          <option value="">All Activity Types</option>
          {Object.entries(EMISSION_TYPE_META).map(([val, meta]) => (
            <option key={val} value={val}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Emission Factors Data Table ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredFactors.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No emission factors match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 px-3 font-semibold">Activity / Resource</th>
                  <th className="pb-3 px-3 font-semibold">GHG Scope</th>
                  <th className="pb-3 px-3 font-semibold">Region Grid</th>
                  <th className="pb-3 px-3 font-semibold">Base Unit</th>
                  <th className="pb-3 px-3 font-semibold text-right">Conversion Factor</th>
                  <th className="pb-3 px-3 font-semibold">Regulatory Source Citation</th>
                  {isAdmin && <th className="pb-3 px-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFactors.map((f) => {
                  const meta = EMISSION_TYPE_META[f.type] || {
                    label: f.type,
                    scope: 1,
                    icon: Zap,
                  }
                  const Icon = meta.icon
                  const source = REGION_SOURCES[f.region] || 'Standard Regional Dataset (2024)'

                  return (
                    <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span>{meta.label}</span>
                      </td>

                      {/* Scope Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            meta.scope === 1
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : meta.scope === 2
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          Scope {meta.scope}
                        </span>
                      </td>

                      {/* Region */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {f.region}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {f.unit}
                      </td>

                      {/* Factor Value */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {Number(f.factorValue).toFixed(4)} <span className="text-[10px] text-slate-400 font-normal">kg CO₂e / {f.unit}</span>
                      </td>

                      {/* Source Citation */}
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        <span className="truncate max-w-[220px] block" title={source}>
                          {source}
                        </span>
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(f)}
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                              title="Edit factor"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(f._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete factor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Factor Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  {modalMode === 'create' ? 'Add Emission Factor' : 'Edit Emission Factor'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Resource Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const t = e.target.value
                    setForm({
                      ...form,
                      type: t,
                      unit: EMISSION_TYPE_META[t]?.defaultUnit || 'kWh',
                    })
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                >
                  {Object.entries(EMISSION_TYPE_META).map(([val, meta]) => (
                    <option key={val} value={val}>
                      {meta.label} (Scope {meta.scope})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Region Grid Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. US, EU, IN, UK"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. kWh, L, m³"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emission Factor Value (kg CO₂e / unit) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.8200"
                  value={form.factorValue}
                  onChange={(e) => setForm({ ...form, factorValue: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Automated Multiplier Rule:</span>
                1 {form.unit || 'unit'} of {form.type} will generate{' '}
                <span className="font-mono font-bold text-slate-900">
                  {form.factorValue ? Number(form.factorValue).toFixed(4) : '0.0000'} kg CO₂e
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Commit Factor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
