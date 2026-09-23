import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

// ── Validation schemas ────────────────────────────────────────────────────────

const orgSchema = yup.object({
  name: yup.string().trim().min(1).required('Organization name is required'),
})

const facilitySchema = yup.object({
  name: yup.string().trim().min(1).required('Facility name is required'),
  location: yup.string().trim().default(''),
})

// ── Shared UI primitives ──────────────────────────────────────────────────────

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

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}

// ── Organization name form ────────────────────────────────────────────────────

function OrgNameForm({ org, onUpdated }) {
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: yupResolver(orgSchema),
    defaultValues: { name: org?.name ?? '' },
  })

  // Sync default values when org loads
  useEffect(() => {
    if (org) reset({ name: org.name })
  }, [org, reset])

  async function onSubmit({ name }) {
    setServerError('')
    setSuccessMsg('')
    try {
      const res = await api.patch(`/organizations/${org._id}`, { name })
      onUpdated(res.data.data.organization)
      setSuccessMsg('Organization name updated.')
      reset({ name })
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Update failed.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Organization name" error={errors.name?.message}>
        <Input type="text" error={errors.name} {...register('name')} />
      </Field>
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {successMsg && <p className="text-sm text-emerald-700">{successMsg}</p>}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

// ── Facility form (create / edit) ─────────────────────────────────────────────

function FacilityForm({ initial, onSave, onCancel }) {
  const [serverError, setServerError] = useState('')
  const isEdit = !!initial

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(facilitySchema),
    defaultValues: { name: initial?.name ?? '', location: initial?.location ?? '' },
  })

  async function onSubmit(data) {
    setServerError('')
    try {
      let res
      if (isEdit) {
        res = await api.patch(`/facilities/${initial._id}`, data)
      } else {
        res = await api.post('/facilities', data)
      }
      onSave(res.data.data.facility, isEdit)
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Save failed.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Field label="Facility name" error={errors.name?.message}>
        <Input type="text" error={errors.name} {...register('name')} />
      </Field>
      <Field label="Location (optional)" error={errors.location?.message}>
        <Input type="text" error={errors.location} {...register('location')} />
      </Field>
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Add facility'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// ── Facility list ─────────────────────────────────────────────────────────────

function FacilityList({ facilities, isAdmin, onEdit, onDelete }) {
  if (facilities.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No facilities yet. Add one below.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {facilities.map((f) => (
        <li key={f._id} className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{f.name}</p>
            {f.location && (
              <p className="text-xs text-slate-500">{f.location}</p>
            )}
          </div>
          {isAdmin && (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => onEdit(f)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(f)}
                className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [org, setOrg] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  // Editing state
  const [editingFacility, setEditingFacility] = useState(null) // facility object
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [orgRes, facRes] = await Promise.all([
          api.get(`/organizations/${user.organization}`),
          api.get('/facilities'),
        ])
        setOrg(orgRes.data.data.organization)
        setFacilities(facRes.data.data.facilities)
      } catch (err) {
        setPageError(err.response?.data?.error?.message || 'Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  function handleFacilitySaved(facility, isEdit) {
    setFacilities((prev) =>
      isEdit ? prev.map((f) => (f._id === facility._id ? facility : f)) : [...prev, facility],
    )
    setEditingFacility(null)
    setShowAddForm(false)
  }

  async function handleDelete(facility) {
    setDeleteError('')
    if (!window.confirm(`Delete facility "${facility.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/facilities/${facility._id}`)
      setFacilities((prev) => prev.filter((f) => f._id !== facility._id))
    } catch (err) {
      setDeleteError(err.response?.data?.error?.message || 'Delete failed.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-slate-500">Loading settings…</span>
      </div>
    )
  }

  if (pageError) {
    return <p className="mt-4 text-sm text-red-600">{pageError}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>

      {/* Organization */}
      <SectionCard title="Organization">
        {isAdmin ? (
          <OrgNameForm org={org} onUpdated={setOrg} />
        ) : (
          <p className="text-sm text-slate-700">
            <span className="font-medium">Name:</span> {org?.name}
          </p>
        )}
      </SectionCard>

      {/* Facilities */}
      <SectionCard title="Facilities">
        <FacilityList
          facilities={facilities}
          isAdmin={isAdmin}
          onEdit={(f) => { setEditingFacility(f); setShowAddForm(false) }}
          onDelete={handleDelete}
        />

        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}

        {/* Inline edit form */}
        {editingFacility && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Edit — {editingFacility.name}
            </p>
            <FacilityForm
              initial={editingFacility}
              onSave={handleFacilitySaved}
              onCancel={() => setEditingFacility(null)}
            />
          </div>
        )}

        {/* Add form — admin / data_entry */}
        {(isAdmin || user?.role === 'data_entry') && !editingFacility && (
          <div className="mt-4">
            {showAddForm ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">New facility</p>
                <FacilityForm
                  onSave={handleFacilitySaved}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 rounded-md border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                + Add facility
              </button>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
