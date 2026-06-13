import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'

export default function EditableTitle({ value, onSave, className = '', inputClassName = '', showIcon = false }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  useEffect(() => { if (!editing) setVal(value) }, [value, editing])

  const commit = () => {
    const trimmed = val.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setVal(value); setEditing(false) }
        }}
        className={`bg-transparent focus:outline-none ${inputClassName}`}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to rename"
      className={`cursor-text group/title inline-flex items-center gap-2 ${className}`}
    >
      {value}
      {showIcon && (
        <Pencil size={13} className="opacity-0 group-hover/title:opacity-40 transition-opacity flex-shrink-0" />
      )}
    </span>
  )
}
