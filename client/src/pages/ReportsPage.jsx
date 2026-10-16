import React, { useEffect, useState } from 'react'
import {
  generateReport,
  listReports,
  downloadReport,
  deleteReport,
} from '../services/pdfReportService.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  FileText,
  FileDown,
  Download,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  Globe2,
  Award,
  BookOpen,
  Info,
  Clock,
} from 'lucide-react'

const FRAMEWORKS = [
  {
    id: 'ghg',
    title: 'GHG Protocol Corporate Standard',
    tag: 'GLOBAL STANDARD',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Comprehensive Scope 1, 2, and 3 carbon accounting package with facility breakdowns and emission factor lineage.',
    standard: 'WRI / WBCSD Standard',
  },
  {
    id: 'brsr',
    title: 'SEBI BRSR Framework (India)',
    tag: 'REGULATORY MANDATE',
    tagColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Business Responsibility and Sustainability Reporting aligned with SEBI Principle 6 environmental indicators.',
    standard: 'SEBI Circular 2021',
  },
  {
    id: 'csrd',
    title: 'EU CSRD / ESRS E1 Climate',
    tag: 'EUROPEAN DIRECTIVE',
    tagColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'European Corporate Sustainability Reporting Directive metrics with gross emissions and intensity ratios.',
    standard: 'EFRAG Standard',
  },
  {
    id: 'exec',
    title: 'Executive CSO Audit Summary',
    tag: 'BOARD DISCLOSURE',
    tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'High-level executive carbon balance sheet formatted for board review, investor relations, and lenders.',
    standard: 'Internal Governance',
  },
]

export default function ReportsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'data_entry'

  const [facilities, setFacilities] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Report Generator Form State
  const [selectedFramework, setSelectedFramework] = useState('ghg')
  const [periodStart, setPeriodStart] = useState('2024-01-01')
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10))
  const [selectedFacility, setSelectedFacility] = useState('')
  const [generating, setGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [facRes, repRes] = await Promise.all([
        api.get('/facilities'),
        listReports({ limit: 50 }),
      ])
      setFacilities(facRes.data.data.facilities || [])
      setReports(repRes.reports || [])
    } catch (err) {
      setError('Unable to load reports center.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Generate Report
  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!periodStart || !periodEnd) {
      setError('Please specify both period start and end dates.')
      return
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      setError('Period start date must be before period end date.')
      return
    }

    setGenerating(true)
    try {
      const res = await generateReport({
        periodStart,
        periodEnd,
        facilityId: selectedFacility || undefined,
      })

      setSuccessMessage('Report generated successfully! Compiling PDF for download...')
      await loadData()

      // Automatically trigger download of the newly generated report
      if (res.report?._id) {
        const filename = `CarbonTrack_${selectedFramework.toUpperCase()}_${periodStart}_to_${periodEnd}.pdf`
        await downloadReport(res.report._id, filename)
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate PDF report.')
    } finally {
      setGenerating(false)
    }
  }

  // Download Existing Report
  async function handleDownload(report) {
    setDownloadingId(report._id)
    try {
      const start = new Date(report.periodStart).toISOString().slice(0, 10)
      const end = new Date(report.periodEnd).toISOString().slice(0, 10)
      const filename = `CarbonTrack_Report_${start}_to_${end}.pdf`
      await downloadReport(report._id, filename)
    } catch (err) {
      alert('Failed to download report PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  // Delete Report
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this generated report record?')) return
    try {
      await deleteReport(id)
      setReports((prev) => prev.filter((r) => r._id !== id))
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete report.')
    }
  }

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Sustainability Reports & Compliance
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ISO 14064 Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export verified statutory disclosures, ESG compliance frameworks, and audit-ready PDF packages.
          </p>
        </div>
      </div>

      {/* ── Feedback Messages ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Reporting Framework Selection Cards (4 Cards) ─────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-slate-700">
            Select Reporting Standard & Framework
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FRAMEWORKS.map((fw) => {
            const isSelected = selectedFramework === fw.id
            return (
              <div
                key={fw.id}
                onClick={() => setSelectedFramework(fw.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/40 border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${fw.tagColor}`}
                    >
                      {fw.tag}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>

                  <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                    {fw.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {fw.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{fw.standard}</span>
                  <span className="text-emerald-700 font-semibold font-sans text-xs">Select →</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Report Compiler Generator Form ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Compile Official Disclosure Package
              </h2>
              <p className="text-[11px] text-slate-500">
                Selected Framework:{' '}
                <span className="font-semibold text-slate-800">
                  {FRAMEWORKS.find((f) => f.id === selectedFramework)?.title}
                </span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border">
            ISO 14064-1 Compliant PDF
          </span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Period Start */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period Start Date *
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                required
              />
            </div>

            {/* Period End */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period End Date *
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                required
              />
            </div>

            {/* Scope / Facility Boundary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operational Boundary Scope
              </label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
              >
                <option value="">All Corporate Facilities (Consolidated)</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Includes Scope 1-3 charts, intensity ratios, and emission factor audit ledger.</span>
            </div>

            <button
              type="submit"
              disabled={generating || !isAdmin}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer self-stretch sm:self-auto"
            >
              {generating ? (
                <span>Generating Official PDF...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Compile & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Generated Reports History Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900">
              Published Reports & Audit Archive
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Historical statutory compliance packages and downloaded PDF files.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{reports.length} generated documents</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No reports generated yet. Use the compiler above to generate your first audit report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 px-3 font-semibold">Report Title / Document</th>
                  <th className="pb-3 px-3 font-semibold">Reporting Period</th>
                  <th className="pb-3 px-3 font-semibold">Generated By</th>
                  <th className="pb-3 px-3 font-semibold">Timestamp</th>
                  <th className="pb-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => {
                  const isDownloading = downloadingId === rep._id
                  const startStr = new Date(rep.periodStart).toISOString().slice(0, 10)
                  const endStr = new Date(rep.periodEnd).toISOString().slice(0, 10)

                  return (
                    <tr key={rep._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[240px]">
                          CarbonTrack Sustainability Disclosure ({startStr} to {endStr})
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {startStr} → {endStr}
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        {rep.generatedBy?.name || 'Administrator'}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(rep.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(rep)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(rep._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
    </div>
  )
}
