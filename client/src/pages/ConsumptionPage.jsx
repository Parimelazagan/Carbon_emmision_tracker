import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  listConsumptionRecords,
  createConsumptionRecord,
  updateConsumptionRecord,
  deleteConsumptionRecord,
  verifyConsumptionRecord,
} from '../services/consumptionService.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Activity,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  FileSpreadsheet,
  Zap,
  Flame,
  Droplets,
  Car,
  X,
  Sparkles,
  Calculator,
  ArrowRight,
  Info,
} from 'lucide-react'

const EMISSION_TYPES = [
  { value: 'electricity', label: 'Electricity (Grid Power)', scope: 2, icon: Zap, defaultUnit: 'kWh', units: ['kWh'] },
  { value: 'natural_gas', label: 'Natural Gas', scope: 1, icon: Flame, defaultUnit: 'm3', units: ['m3'] },
  { value: 'diesel', label: 'Diesel Fuel (Fleet / Genset)', scope: 1, icon: Car, defaultUnit: 'litre', units: ['litre'] },
  { value: 'petrol', label: 'Petrol / Gasoline', scope: 1, icon: Car, defaultUnit: 'litre', units: ['litre'] },
  { value: 'water', label: 'Municipal Water & Treatment', scope: 3, icon: Droplets, defaultUnit: 'm3', units: ['m3'] },
]

const REGIONS = [
  { value: 'US',        label: 'United States (US EPA eGRID)' },
  { value: 'EU',        label: 'European Union (EEA Average)' },
  { value: 'UK',        label: 'United Kingdom (DEFRA Standard)' },
  { value: 'India',     label: 'India (CEA Grid Baseline)' },
  { value: 'Australia', label: 'Australia (NGER)' },
  { value: 'Global',    label: 'Global / International (IEA)' },
]

// Approximate factor multipliers for live preview (matches DB region keys)
const APPROX_FACTORS = {
  electricity: { US: 0.386, EU: 0.276, UK: 0.205, India: 0.716, Australia: 0.65, Global: 0.48 }, // kg/kWh
  natural_gas: { US: 1.93,  EU: 2.00,  UK: 2.02,  India: 1.99,  Australia: 1.94, Global: 1.97 }, // kg/m3
  diesel:      { US: 2.68,  EU: 2.64,  UK: 2.51,  India: 2.68,  Australia: 2.70, Global: 2.65 }, // kg/litre
  petrol:      { US: 2.35,  EU: 2.31,  UK: 2.31,  India: 2.33,  Australia: 2.29, Global: 2.31 }, // kg/litre
  water:       { US: 0.376, EU: 0.30,  UK: 0.344, India: 0.35,  Australia: 0.41, Global: 0.34 }, // kg/m3
}

export default function ConsumptionPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [records, setRecords] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFacility, setSelectedFacility] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const [form, setForm] = useState({
    facilityId: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'electricity',
    amount: '',
    unit: 'kWh',
    region: 'India',
  })

  // Load facilities and records
  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [facRes, recRes] = await Promise.all([
        api.get('/facilities'),
        listConsumptionRecords({ limit: 100 }),
      ])
      const facs = facRes.data.data.facilities || []
      setFacilities(facs)
      setRecords(recRes.records || [])

      if (facs.length > 0 && !form.facilityId) {
        setForm((prev) => ({ ...prev, facilityId: facs[0]._id }))
      }
    } catch (err) {
      setError('Unable to load consumption activity ledger.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-switch unit when emission type changes
  function handleTypeChange(newType) {
    const found = EMISSION_TYPES.find((t) => t.value === newType)
    setForm({
      ...form,
      type: newType,
      unit: found ? found.defaultUnit : 'kWh',
    })
  }

  // Live estimated emission calculation
  const liveCalc = useMemo(() => {
    const amt = parseFloat(form.amount) || 0
    const factor = (APPROX_FACTORS[form.type] && APPROX_FACTORS[form.type][form.region]) || 0.5
    let multiplier = 1
    if (form.unit === 'MWh') multiplier = 1000
    if (form.unit === 'gallons') multiplier = 3.785
    if (form.unit === 'litres' && form.type === 'water') multiplier = 0.001

    const kgCO2e = amt * multiplier * factor
    const tCO2e = kgCO2e / 1000
    const typeObj = EMISSION_TYPES.find((t) => t.value === form.type)

    return {
      scope: typeObj ? typeObj.scope : 1,
      factorRate: factor,
      kgCO2e: kgCO2e.toFixed(2),
      tCO2e: tCO2e.toFixed(4),
    }
  }, [form])

  // Open Create Modal
  function handleOpenCreate() {
    setModalMode('create')
    setEditingId(null)
    setModalError('')
    setForm({
      facilityId: facilities[0]?._id || '',
      date: new Date().toISOString().slice(0, 10),
      type: 'electricity',
      amount: '',
      unit: 'kWh',
      region: 'India',
    })
    setShowModal(true)
  }

  // Open Edit Modal
  function handleOpenEdit(r) {
    setModalMode('edit')
    setEditingId(r._id)
    setModalError('')
    setForm({
      facilityId: r.facility?._id || r.facility,
      date: new Date(r.date).toISOString().slice(0, 10),
      type: r.type,
      amount: String(r.amount),
      unit: r.unit,
      region: r.region || 'US',
    })
    setShowModal(true)
  }

  // Submit Create / Edit Form
  async function handleSubmitForm(e) {
    e.preventDefault()
    setModalError('')

    if (!form.facilityId) {
      setModalError('Please select a facility')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setModalError('Please enter a valid positive consumption amount')
      return
    }

    setSubmitting(true)
    try {
      if (modalMode === 'create') {
        await createConsumptionRecord({
          facilityId: form.facilityId,
          date: new Date(form.date).toISOString(),
          type: form.type,
          amount: Number(form.amount),
          unit: form.unit,
          region: form.region,
        })
      } else {
        await updateConsumptionRecord(editingId, {
          date: new Date(form.date).toISOString(),
          type: form.type,
          amount: Number(form.amount),
          unit: form.unit,
          region: form.region,
        })
      }
      setShowModal(false)
      await loadData()
    } catch (err) {
      setModalError(err.response?.data?.error?.message || 'Failed to save consumption record.')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle or Verify Status (Admin)
  async function handleVerify(id, currentStatus) {
    if (!isAdmin) return
    const nextStatus = currentStatus === 'verified' ? 'unverified' : 'verified'
    try {
      await verifyConsumptionRecord(id, nextStatus)
      setRecords((prev) =>
        prev.map((r) => (r._id === id ? { ...r, verificationStatus: nextStatus } : r)),
      )
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update verification status.')
    }
  }

  // Delete Record
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this consumption reading?')) return
    try {
      await deleteConsumptionRecord(id)
      setRecords((prev) => prev.filter((r) => r._id !== id))
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete record.')
    }
  }

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const facName = r.facility?.name || ''
      const matchesSearch =
        facName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.enteredBy?.name && r.enteredBy.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const facId = r.facility?._id || r.facility
      const matchesFac = !selectedFacility || facId === selectedFacility
      const matchesType = !selectedType || r.type === selectedType
      const matchesStatus = !selectedStatus || (r.verificationStatus || 'unverified') === selectedStatus

      return matchesSearch && matchesFac && matchesType && matchesStatus
    })
  }, [records, searchQuery, selectedFacility, selectedType, selectedStatus])

  // Statistics
  const totalKg = records.reduce((sum, r) => sum + (r.calculatedCO2e || 0), 0)
  const verifiedCount = records.filter((r) => r.verificationStatus === 'verified').length

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Consumption Data Hub
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Audit Trail Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log and verify activity meter readings, fuel receipts, and batch emissions across operational sites.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk CSV / Excel</span>
          </Link>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity Reading</span>
          </button>
        </div>
      </div>

      {/* ── Top Summary Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Total Logged Events
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-slate-900">
                {records.length}
              </span>
              <span className="text-xs text-slate-500">entries</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/90 p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Auditor Verified
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-slate-900">
                {verifiedCount}
              </span>
              <span className="text-xs text-slate-500">of {records.length} events</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Total Carbon Impact
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-slate-900">
                {(totalKg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </span>
              <span className="font-mono text-xs text-slate-500">tCO₂e</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by facility, fuel, or entered by..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Facility Dropdown */}
        <select
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-emerald-600"
        >
          <option value="">All Facilities</option>
          {facilities.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Type Dropdown */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-emerald-600"
        >
          <option value="">All Activity Types</option>
          {EMISSION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-emerald-600"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="estimated">Estimated</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* ── Main Activity Ledger Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No activity records found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {searchQuery || selectedFacility || selectedType || selectedStatus
                ? 'Try clearing your filters.'
                : 'Get started by logging manual consumption readings.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Log Reading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Facility & Location</th>
                  <th className="py-3 px-4 font-semibold">Resource Activity</th>
                  <th className="py-3 px-4 font-semibold">Scope</th>
                  <th className="py-3 px-4 font-semibold text-right">Consumption Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Calculated Output</th>
                  <th className="py-3 px-4 font-semibold text-center">Source</th>
                  <th className="py-3 px-4 font-semibold text-center">Verification</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => {
                  const isVer = r.verificationStatus === 'verified'
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(r.date).toISOString().slice(0, 10)}
                      </td>

                      {/* Facility */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                          {r.facility?.name || 'Unknown Site'}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {r.facility?.location || r.region || '—'}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 capitalize">
                          {r.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Model: {r.region || 'Global'}
                        </span>
                      </td>

                      {/* Scope Badge */}
                      <td className="py-3 px-4">
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

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {r.amount.toLocaleString()} <span className="text-slate-400">{r.unit}</span>
                      </td>

                      {/* CO2e */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {(r.calculatedCO2e / 1000).toFixed(3)} <span className="text-[10px] text-slate-500 font-normal">tCO₂e</span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                          {r.source || 'manual'}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleVerify(r._id, r.verificationStatus)}
                          disabled={!isAdmin}
                          title={isAdmin ? 'Click to toggle verification status' : 'Admin only'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                            isVer
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.verificationStatus === 'estimated'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          {isVer ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="capitalize">{r.verificationStatus || 'unverified'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            title="Edit reading"
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r._id)}
                            title="Delete reading"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Log / Edit Consumption Modal Overlay ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  {modalMode === 'create' ? 'Log Consumption Activity' : 'Edit Consumption Record'}
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

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Facility */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility / Operational Site *
                  </label>
                  <select
                    value={form.facilityId}
                    onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                    required
                  >
                    {facilities.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reading / Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              {/* Resource / Activity Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resource & Emission Activity *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EMISSION_TYPES.map((t) => {
                    const Icon = t.icon
                    const isSelected = form.type === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleTypeChange(t.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span
                            className={`text-[9px] font-mono px-1 rounded ${
                              t.scope === 1
                                ? 'bg-amber-100 text-amber-800'
                                : t.scope === 2
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            S{t.scope}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold mt-1 truncate block">{t.label.split('(')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Consumption Amount & Unit & Region */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 12500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  >
                    {EMISSION_TYPES.find((t) => t.value === form.type)?.units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Region Grid *
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.value} ({r.label.split('(')[1]?.replace(')', '') || r.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Real-Time Emission Factor Calculation Preview ───────────────────────── */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Emission Factor Engine:</span>
                  <span className="font-semibold text-slate-700">~{liveCalc.factorRate} kg CO₂e / {form.unit}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/70">
                  <span className="font-semibold text-slate-700">Live Computed Impact:</span>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-slate-900">{liveCalc.tCO2e} tCO₂e</span>
                    <span className="text-[10px] text-slate-500 block">({liveCalc.kgCO2e} kg CO₂e)</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
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
                  {submitting
                    ? 'Saving entry...'
                    : modalMode === 'create'
                    ? 'Commit to ESG Ledger'
                    : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
