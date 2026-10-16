import React, { useState, useEffect, useRef } from 'react'
import {
  uploadConsumptionFile,
  listUploadBatches,
  getUploadBatch,
} from '../services/uploadService.js'
import { api } from '../services/api.js'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Building2,
  FileText,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Info,
} from 'lucide-react'

export default function UploadPage() {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Upload Result State
  const [lastResult, setLastResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Batches history
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)

  // Facilities reference for mapping helper
  const [facilities, setFacilities] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  // Batch Detail Modal
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null)
  const [loadingBatchDetails, setLoadingBatchDetails] = useState(false)

  async function loadInitialData() {
    setLoadingBatches(true)
    try {
      const [batchRes, facRes] = await Promise.all([
        listUploadBatches({ limit: 20 }),
        api.get('/facilities'),
      ])
      setBatches(batchRes.batches || [])
      setFacilities(facRes.data.data.facilities || [])
    } catch (err) {
      console.error('Failed to load upload center history:', err)
    } finally {
      setLoadingBatches(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  function handleFileSelect(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.')
      return
    }
    setErrorMessage('')
    setSelectedFile(file)
    setLastResult(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setUploadProgress(0)
    setErrorMessage('')

    try {
      const result = await uploadConsumptionFile(selectedFile, (progress) => {
        setUploadProgress(progress)
      })
      setLastResult(result)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadInitialData()
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error?.message ||
          'Batch upload failed. Please verify that your spreadsheet matches the required schema.',
      )
    } finally {
      setUploading(false)
    }
  }

  // Generate & Download sample CSV
  function downloadTemplateCSV() {
    const sampleFacilityId = facilities[0]?._id || 'FACILITY_ID_HERE'
    const headers = 'date,facilityId,type,amount,unit,region'
    const sampleRows = [
      `2026-03-01,${sampleFacilityId},electricity,14500,kWh,US`,
      `2026-03-02,${sampleFacilityId},natural_gas,850,m³,US`,
      `2026-03-05,${sampleFacilityId},diesel,320,L,US`,
      `2026-03-10,${sampleFacilityId},water,450,m³,US`,
      `2026-03-15,${sampleFacilityId},petrol,180,L,US`,
    ]

    const csvContent = [headers, ...sampleRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'CarbonTrack_Consumption_Template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function copyToClipboard(id) {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function viewBatchErrors(batchId) {
    setLoadingBatchDetails(true)
    try {
      const res = await getUploadBatch(batchId)
      setSelectedBatchDetails(res.batch)
    } catch (err) {
      alert('Failed to retrieve batch error ledger.')
    } finally {
      setLoadingBatchDetails(false)
    }
  }

  return (
    <div className="space-y-7 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Bulk Upload & Ingestion Center
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Automated Schema Validator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            High-throughput ingestion pipeline for monthly utility spreadsheets, submeter logs, and ERP emission records.
          </p>
        </div>

        <button
          onClick={downloadTemplateCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Ingestion Card & Dropzone ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Drag & Drop Zone */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold font-display text-slate-900">
                  Upload Consumption File
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Supported: .CSV, .XLSX, .XLS</span>
            </div>

            {/* Drop area */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 shadow-xs flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation
                  </p>
                  <span className="inline-block mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Click or drag new file to change
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Drag and drop your spreadsheet here, or <span className="text-emerald-700 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Auto-maps date, facilityId, type, amount, unit, and regional emission grid factors.
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600">Uploading and validating rows...</span>
                  <span className="font-bold text-emerald-700">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> All rows validated against ISO 14064 criteria
            </span>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span>Ingesting Data...</span>
              ) : (
                <>
                  <span>Start Ingestion & Validate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 4 cols: Facility Reference ID Helper */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold font-display text-slate-900">
                  Facility ID Reference
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Copy to CSV</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Your spreadsheet must use exact <code className="bg-slate-100 px-1 rounded font-mono">facilityId</code> codes:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {facilities.map((f) => (
                <div
                  key={f._id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{f.name}</p>
                    <p className="font-mono text-[10px] text-slate-400 truncate">{f._id}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(f._id)}
                    title="Copy Facility ID"
                    className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-emerald-700 border border-transparent hover:border-slate-200 transition-colors shrink-0"
                  >
                    {copiedId === f._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Required CSV Columns:</p>
            <p className="font-mono text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border">
              date, facilityId, type, amount, unit, region
            </p>
          </div>
        </div>
      </div>

      {/* ── Latest Ingestion Results Ledger ──────────────────────────────────────── */}
      {lastResult && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold font-display text-slate-900">
                Ingestion Results: {lastResult.batch?.fileName || 'Spreadsheet Import'}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total Rows: {lastResult.batch?.totalRows}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">
                Successfully Imported
              </span>
              <span className="text-xl font-bold font-display text-emerald-950 mt-1 block">
                {lastResult.batch?.importedRows} rows
              </span>
            </div>
            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-rose-700 font-bold block">
                Rejected Rows
              </span>
              <span className="text-xl font-bold font-display text-rose-950 mt-1 block">
                {lastResult.batch?.rejectedRows} rows
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Status
              </span>
              <span className="text-xl font-bold font-display text-slate-900 mt-1 capitalize block">
                {lastResult.batch?.status}
              </span>
            </div>
          </div>

          {/* Rejected Details Table */}
          {lastResult.batch?.rejectedDetails && lastResult.batch.rejectedDetails.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors & Rejections:
              </h3>
              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50 border-b border-rose-200 text-rose-800 text-[10px] uppercase font-mono">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Rejection Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 bg-white">
                    {lastResult.batch.rejectedDetails.map((rej, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{rej.row}</td>
                        <td className="py-2 px-3 text-rose-700">{rej.reasons.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Ingestion Pipeline History Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900">
              Batch Ingestion Audit Trail
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Historical record of all bulk uploads, row counts, and validation logs.
            </p>
          </div>
          <button
            onClick={loadInitialData}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingBatches ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No previous upload batches found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 px-2 font-semibold">File Name</th>
                  <th className="pb-3 px-2 font-semibold">Timestamp</th>
                  <th className="pb-3 px-2 font-semibold">Uploaded By</th>
                  <th className="pb-3 px-2 font-semibold text-right">Processed / Total</th>
                  <th className="pb-3 px-2 font-semibold text-center">Status</th>
                  <th className="pb-3 px-2 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const isDone = b.status === 'completed'
                  const isPartial = b.status === 'partial'

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-semibold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{b.fileName}</span>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        {b.uploadedBy?.name || 'Administrator'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-800 whitespace-nowrap">
                        <span className="font-bold text-emerald-700">{b.importedRows}</span> / {b.totalRows} rows
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPartial
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isPartial ? (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{b.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {b.rejectedRows > 0 ? (
                          <button
                            onClick={() => viewBatchErrors(b._id)}
                            className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline"
                          >
                            View {b.rejectedRows} Error(s)
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Clean Import</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Batch Error Log Modal ─────────────────────────────────────────────────── */}
      {selectedBatchDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Batch Error Log: {selectedBatchDetails.fileName}
              </h3>
              <button
                onClick={() => setSelectedBatchDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {selectedBatchDetails.rejectedDetails?.map((rej, idx) => (
                <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                  <span className="font-mono font-bold text-rose-900 block mb-1">Row #{rej.row}</span>
                  <p className="text-rose-700">{rej.reasons?.join(', ')}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedBatchDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
