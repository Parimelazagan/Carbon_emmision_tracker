import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { fetchDashboardData } from '../services/reportService.js'
import { scopeColors } from '../components/charts/chartColors.js'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  Maximize2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  MapPin,
  X,
  FileSpreadsheet,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react'

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')

  // Add Facility Modal State
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [modalError, setModalError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    floorAreaSqM: '',
    headcount: '',
  })

  // Facility-level emissions lookup
  const [facilityEmissions, setFacilityEmissions] = useState({})

  async function loadFacilities() {
    setLoading(true)
    setError('')
    try {
      const [facRes, dashRes] = await Promise.all([
        api.get('/facilities'),
        fetchDashboardData(),
      ])

      const facList = facRes.data.data.facilities || []
      setFacilities(facList)

      // Map emissions by facility ID
      const emMap = {}
      if (dashRes.byFacility) {
        dashRes.byFacility.forEach((f) => {
          emMap[f.facilityId] = f.co2e
        })
      }
      setFacilityEmissions(emMap)
    } catch (err) {
      setError('Unable to load facilities directory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFacilities()
  }, [])

  // Aggregate stats
  const totalFloorArea = facilities.reduce((sum, f) => sum + (f.floorAreaSqM || 0), 0)
  const totalHeadcount = facilities.reduce((sum, f) => sum + (f.headcount || 0), 0)
  const totalEmissions = Object.values(facilityEmissions).reduce((sum, val) => sum + (val || 0), 0)
  const avgIntensity = totalFloorArea > 0 ? ((totalEmissions * 1000) / totalFloorArea).toFixed(1) : '0.0'

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.location && f.location.toLowerCase().includes(searchQuery.toLowerCase()))

      if (regionFilter === 'all') return matchesSearch
      return matchesSearch && f.location && f.location.toLowerCase().includes(regionFilter.toLowerCase())
    })
  }, [facilities, searchQuery, regionFilter])

  // Handle Add Facility Form
  async function handleCreateFacility(e) {
    e.preventDefault()
    setModalError('')
    if (!formData.name.trim()) {
      setModalError('Facility name is required')
      return
    }

    setCreating(true)
    try {
      await api.post('/facilities', {
        name: formData.name.trim(),
        location: formData.location.trim(),
        floorAreaSqM: formData.floorAreaSqM ? Number(formData.floorAreaSqM) : null,
        headcount: formData.headcount ? Number(formData.headcount) : null,
      })
      setShowModal(false)
      setFormData({ name: '', location: '', floorAreaSqM: '', headcount: '' })
      await loadFacilities()
    } catch (err) {
      setModalError(err.response?.data?.error?.message || 'Failed to create facility.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header Section ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Facilities & Operational Sites
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              {facilities.length} Monitored Sites
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage global corporate operational boundaries, floor area dimensions, monitored headcount, and carbon intensity benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Facility</span>
          </button>
        </div>
      </div>

      {/* ── Top KPI Stat Strip (4 Cards) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sites count */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Operational Sites
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {facilities.length}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">Sites</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> 100% boundary reporting coverage
          </p>
        </div>

        {/* Total Floor Area */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Floor Area
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {totalFloorArea.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">m²</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Total gross monitored footprint</p>
        </div>

        {/* Monitored Headcount */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Monitored Headcount
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {totalHeadcount.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">Employees</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">On-site workplace personnel</p>
        </div>

        {/* Portfolio Carbon Intensity */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Portfolio Intensity
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {avgIntensity}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">kg CO₂e / m²</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Area-normalized benchmark
          </p>
        </div>
      </div>

      {/* ── Search and Filter Toolbar ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility by name or location..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Regional Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 self-stretch sm:self-auto">
          {['all', 'USA', 'Europe', 'India', 'APAC'].map((reg) => (
            <button
              key={reg}
              onClick={() => setRegionFilter(reg)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize ${
                regionFilter === reg
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {reg === 'all' ? 'All Locations' : reg}
            </button>
          ))}
        </div>
      </div>

      {/* ── Facility Cards Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No facilities found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery ? 'Try adjusting your search filter' : 'Get started by provisioning your first corporate facility.'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Add Facility
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFacilities.map((fac) => {
            const em = facilityEmissions[fac._id] || 0
            const intensity = fac.floorAreaSqM ? ((em * 1000) / fac.floorAreaSqM).toFixed(1) : null
            const headcountIntensity = fac.headcount ? (em / fac.headcount).toFixed(2) : null

            return (
              <div
                key={fac._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900 line-clamp-1">
                        {fac.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{fac.location || 'Global Headquarters'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      ISO 14064
                    </span>
                  </div>

                  {/* Dimensions Strip */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Floor Area</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {fac.floorAreaSqM ? `${fac.floorAreaSqM.toLocaleString()} m²` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Personnel</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {fac.headcount ? `${fac.headcount.toLocaleString()} staff` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Total Emissions & Intensity */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500">Facility Footprint:</span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {em.toLocaleString('en-US', { maximumFractionDigits: 1 })} <span className="text-[10px] text-slate-500 font-normal">tCO₂e</span>
                      </span>
                    </div>
                    {intensity && (
                      <div className="flex items-baseline justify-between mt-1 text-[11px]">
                        <span className="text-slate-500">Intensity:</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          {intensity} kg CO₂e / m²
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Activity Telemetry</span>
                  <Link
                    to={`/facilities/${fac._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 group"
                  >
                    <span>View Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Facility Modal Overlay ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900">Add Operational Facility</h3>
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

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nordic Logistics & Distribution Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / City & Country
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oslo, Norway"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
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
                    placeholder="e.g. 42000"
                    value={formData.floorAreaSqM}
                    onChange={(e) => setFormData({ ...formData, floorAreaSqM: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headcount (Staff)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={formData.headcount}
                    onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
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
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  {creating ? 'Saving...' : 'Provision Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
