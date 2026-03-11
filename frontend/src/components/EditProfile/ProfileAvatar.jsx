import React, { useRef, useState, useEffect } from 'react'

export default function ProfileAvatar({ name, avatarUrl, avatarFile, onChange }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(avatarUrl || '')

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreview(avatarUrl || '')
  }, [avatarFile, avatarUrl])

  function handlePick() {
    inputRef.current?.click()
  }

  function handleFile(e) {
    const f = e.target.files && e.target.files[0]
    if (f) onChange && onChange(f)
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative">
        <div className="h-28 w-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img src={preview} alt={`${name || 'User'} avatar`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xl">{(name || 'U').slice(0,1).toUpperCase()}</span>
          )}
        </div>
        <button type="button" onClick={handlePick} className="absolute -right-2 -bottom-2 bg-white rounded-full p-1 border shadow-sm" aria-label="Change avatar">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 13V16H7L16 7L13 4L4 13Z" />
          </svg>
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="mt-3 text-center">
        <div className="text-sm font-medium text-gray-900">{name || 'Your name'}</div>
        <div className="text-xs text-gray-500">Tap avatar to change</div>
      </div>
    </div>
  )
}
