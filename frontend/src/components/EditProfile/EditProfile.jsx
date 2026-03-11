import React, { useState, useEffect } from 'react'
import ProfileAvatar from './ProfileAvatar'

export default function EditProfile({ initial = {}, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    specialties: [],
    avatarFile: null,
    ...initial
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(f => ({ ...f, ...initial }))
  }, [initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function handleSpecialtyAdd(tag) {
    if (!tag || form.specialties.includes(tag)) return
    setForm(f => ({ ...f, specialties: [...f.specialties, tag] }))
  }

  function handleSpecialtyRemove(tag) {
    setForm(f => ({ ...f, specialties: f.specialties.filter(t => t !== tag) }))
  }

  function handleAvatarChange(file) {
    setForm(f => ({ ...f, avatarFile: file }))
  }

  function validate() {
    const err = {}
    if (!form.name || form.name.trim().length < 2) err.name = 'Please enter your full name.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Invalid email.'
    if (form.phone && !/^\+?[0-9\s-]{7,20}$/.test(form.phone)) err.phone = 'Invalid phone number.'
    if (form.bio && form.bio.length > 1000) err.bio = 'Bio is too long.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form }
      // If avatarFile exists, handle uploading where parent supplies API
      if (onSave) await onSave(payload)
    } catch (err) {
      // handle/save error - surface a generic message
      setErrors(prev => ({ ...prev, submit: 'Failed to save. Try again.' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex items-start">
          <ProfileAvatar
            name={form.name}
            avatarFile={form.avatarFile}
            avatarUrl={form.avatarUrl}
            onChange={handleAvatarChange}
          />
        </div>

        <div className="md:col-span-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                required
              />
              {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Specialties</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.specialties.map(tag => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-800">
                    {tag}
                    <button type="button" onClick={() => handleSpecialtyRemove(tag)} className="ml-2 text-gray-400 hover:text-gray-600">×</button>
                  </span>
                ))}
                <SpecialtyAdder onAdd={handleSpecialtyAdd} />
              </div>
            </div>

            {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setForm({ ...initial })} className="px-4 py-2 border rounded-md text-gray-700 bg-white">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

function SpecialtyAdder({ onAdd }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex items-center">
      <input aria-label="Add specialty" value={val} onChange={e => setVal(e.target.value)} className="px-2 py-1 rounded-md border-gray-200" />
      <button type="button" onClick={() => { onAdd(val.trim()); setVal('') }} className="ml-2 px-3 py-1 bg-gray-200 rounded-md">Add</button>
    </div>
  )
}
