import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchDashboardData,
  fetchSummary,
} from '../services/reportService.js'
import { api } from '../services/api.js'
import { scopeColors, sourceTypeColors, chartPalette } from '../components/charts/chartColors.js'
import { ChartSkeleton, ChartEmptyState } from '../components/charts/ChartStates.jsx'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  TrendingDown,
  TrendingUp,
  PlusCircle,
  FileDown,
  Building2,
  Calendar,
  Filter,
  ShieldCheck,
  Flame,
  Zap,
  Leaf,
  Layers,
  Sparkles,
  ArrowUpRight,
  Info,
  RefreshCw,
} from 'lucide-react'

// Custom Tooltip for Recharts matching Stitch design system
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[150px]">
        <p className="font-semibold text-slate-300 mb-1.5 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 my-0.5">
            <span className="flex items-center gap-1.5 text-slate-400 capitalize">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {item.name}:
            </span>
            <span className="font-mono font-semibold text-white">
              {Number(item.value).toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">tCO₂e</span>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [selectedFacility, setSelectedFacility] = useState('')
  const [timePreset, setTimePreset] = useState('all')

  const [data, setData] = useState({
    trend: [],
    byScope: [],
    byType: [],
    byFacility: [],
    summary: null,
  })

  // Date range calculation based on preset
  const dateFilters = useMemo(() => {
    const now = new Date()
    let from = null
    let to = null

    if (timePreset === '30d') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timePreset === '90d') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timePreset === 'year') {
      from = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    return {
      facilityId: selectedFacility || undefined,
      from: from || undefined,
      to: to || undefined,
    }
  }, [selectedFacility, timePreset])

  // Load facilities for filter dropdown
  useEffect(() => {
    api
      .get('/facilities')
      .then((res) => setFacilities(res.data.data.facilities || []))
      .catch(() => setFacilities([]))
  }, [])

  // Load dashboard telemetry data
  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchDashboardData(dateFilters)
      setData(res)
    } catch (err) {
      setError('Unable to load emissions dashboard metrics. Please check server connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateFilters])

  // Calculations for Scope percentages
  const scope1Total = data.byScope.find((s) => s.scope === 'Scope 1' || s.scope === 1)?.co2e || 0
  const scope2Total = data.byScope.find((s) => s.scope === 'Scope 2' || s.scope === 2)?.co2e || 0
  const scope3Total = data.byScope.find((s) => s.scope === 'Scope 3' || s.scope === 3)?.co2e || 0
  const grandTotal = (data.summary?.totalCO2e || (scope1Total + scope2Total + scope3Total)) || 0

  const s1Pct = grandTotal > 0 ? ((scope1Total / grandTotal) * 100).toFixed(1) : '0.0'
  const s2Pct = grandTotal > 0 ? ((scope2Total / grandTotal) * 100).toFixed(1) : '0.0'
  const s3Pct = grandTotal > 0 ? ((scope3Total / grandTotal) * 100).toFixed(1) : '0.0'

  // Format trend data for Recharts Area
  const formattedTrend = data.trend.map((t) => ({
    name: t.month,
    emissions: Number((t.co2e / 1000).toFixed(2)) || Number(t.co2e.toFixed(2)), // in tCO2e
  }))

  // Pie data
  const pieData = [
    { name: 'Scope 1 (Direct)', value: scope1Total, color: scopeColors['Scope 1'] },
    { name: 'Scope 2 (Electricity)', value: scope2Total, color: scopeColors['Scope 2'] },
    { name: 'Scope 3 (Value Chain)', value: scope3Total, color: scopeColors['Scope 3'] },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header & Action Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Emissions Overview Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              GHG Corporate Protocol
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated greenhouse gas emissions inventory across Scope 1, Scope 2, and Scope 3 operational boundaries.
          </p>
        </div>

        {/* Global Controls & Primary CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Facility Filter */}
          <div className="relative">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 shadow-xs cursor-pointer"
            >
              <option value="">All Corporate Facilities ({facilities.length})</option>
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} {f.location ? `(${f.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Time Preset */}
          <div className="bg-white border border-slate-200 rounded-xl p-0.5 flex text-xs font-semibold shadow-xs">
            <button
              onClick={() => setTimePreset('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timePreset === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimePreset('year')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timePreset === 'year' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              YTD
            </button>
            <button
              onClick={() => setTimePreset('90d')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timePreset === '90d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
          </div>

          {/* Quick CTAs */}
          <Link
            to="/consumption"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </Link>

          <Link
            to="/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-all"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Generate PDF</span>
          </Link>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="flex items-center gap-1 font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ── Executive KPI Summary Strip (4 Cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emissions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Footprint
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {grandTotal.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">tCO₂e</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {data.summary?.pctChange !== null && data.summary?.pctChange !== undefined ? (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data.summary.pctChange <= 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {data.summary.pctChange <= 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {Math.abs(data.summary.pctChange)}% YoY
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Verified FY Baseline</span>
            )}
            <span className="text-[10px] text-slate-400">({data.summary?.recordCount || 0} events logged)</span>
          </div>
        </div>

        {/* Scope 1 Card */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-mono">
                Scope 1 Direct
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {scope1Total.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">tCO₂e</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Fleet & On-site Gas</span>
            <span className="font-mono font-bold text-amber-700">{s1Pct}% of total</span>
          </div>
        </div>

        {/* Scope 2 Card */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-mono">
                Scope 2 Indirect
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {scope2Total.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">tCO₂e</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Purchased Grid Power</span>
            <span className="font-mono font-bold text-blue-700">{s2Pct}% of total</span>
          </div>
        </div>

        {/* Scope 3 Card */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                Scope 3 Upstream
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {scope3Total.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">tCO₂e</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Water & Value Chain</span>
            <span className="font-mono font-bold text-emerald-700">{s3Pct}% of total</span>
          </div>
        </div>
      </div>

      {/* ── Main Data Visualizations Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historical Emissions Trajectory Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Monthly Emissions Trajectory
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculated carbon output (tCO₂e) mapped over reporting cycle.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Unit: Metric Tonnes (tCO₂e)</span>
          </div>

          {loading ? (
            <ChartSkeleton className="h-72" />
          ) : formattedTrend.length === 0 ? (
            <ChartEmptyState message="No monthly emissions logged for this filter period" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    name="Emissions"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#emissionsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* GHG Protocol Scope Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold font-display text-slate-900">
                GHG Scope Distribution
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Direct vs indirect operational ratio.
              </p>
            </div>

            {loading ? (
              <ChartSkeleton className="h-56" />
            ) : pieData.length === 0 ? (
              <ChartEmptyState message="No scope activity logged yet" />
            ) : (
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-xs font-bold text-slate-900">100%</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Boundaries</span>
                </div>
              </div>
            )}
          </div>

          {/* Scope Legend Strip */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                Scope 1 (Direct)
              </span>
              <span className="font-mono font-bold text-slate-900">{s1Pct}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                Scope 2 (Electricity)
              </span>
              <span className="font-mono font-bold text-slate-900">{s2Pct}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Scope 3 (Upstream)
              </span>
              <span className="font-mono font-bold text-slate-900">{s3Pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Secondary Analysis: Fuel Source & Facility Intensity ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Emissions by Activity & Fuel Type
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Breakdown across electricity, gas, fuels, and resources.
              </p>
            </div>
          </div>

          {loading ? (
            <ChartSkeleton className="h-60" />
          ) : data.byType.length === 0 ? (
            <ChartEmptyState message="No source activity data available" />
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byType} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => val.replace('_', ' ')}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="co2e" name="Output (tCO₂e)" radius={[6, 6, 0, 0]}>
                    {data.byType.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={sourceTypeColors[entry.type] || chartPalette.primary}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Facility Ranking / Site Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-display text-slate-900">
                  Facility Emissions Leaderboard
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Top corporate facilities ranked by carbon output.
                </p>
              </div>
              <Link
                to="/facilities"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View All Sites</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <ChartSkeleton className="h-56" />
            ) : data.byFacility.length === 0 ? (
              <ChartEmptyState message="No facility records found for this period" />
            ) : (
              <div className="space-y-3.5">
                {data.byFacility.slice(0, 4).map((fac, idx) => {
                  const pct = grandTotal > 0 ? ((fac.co2e / grandTotal) * 100).toFixed(1) : '0'
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {fac.facilityName || 'Facility ' + (idx + 1)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-900 font-bold">
                            {fac.co2e.toLocaleString('en-US', { maximumFractionDigits: 1 })} tCO₂e
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" /> Automated grid factor lookup
            </span>
            <Link to="/facilities" className="text-emerald-700 font-semibold hover:underline">
              Manage operational sites →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
