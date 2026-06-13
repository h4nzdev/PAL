import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

// ── Inline parser: **bold**, *italic*, `code` ─────────────────────────────────

function parseInline(text, baseKey) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g)
  return parts.map((part, i) => {
    const key = `${baseKey}-${i}`
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={key} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={key} className="italic text-gray-300">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded text-[0.8em] font-mono"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#a5f3fc' }}
        >
          {part.slice(1, -1)}
        </code>
      )
    return part
  })
}

// ── Code block with copy button ───────────────────────────────────────────────

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="my-3 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] text-gray-600 font-mono">{lang || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-300 transition-colors"
        >
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  )
}

// ── Block parser ──────────────────────────────────────────────────────────────

export default function Markdown({ children, className = '' }) {
  const text   = typeof children === 'string' ? children : ''
  const lines  = text.split('\n')
  const output = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const key  = `md-${i}`

    // ── Fenced code block ────────────────────────────────────────────────────
    if (line.trimStart().startsWith('```')) {
      const lang      = line.trim().slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      output.push(<CodeBlock key={key} code={codeLines.join('\n')} lang={lang} />)
      i++ // skip closing ```
      continue
    }

    // ── H1 ───────────────────────────────────────────────────────────────────
    if (/^# /.test(line)) {
      output.push(
        <p key={key} className="font-bold text-white text-base mt-4 mb-1 leading-snug">
          {parseInline(line.slice(2), key)}
        </p>
      )
    }
    // ── H2 ───────────────────────────────────────────────────────────────────
    else if (/^## /.test(line)) {
      output.push(
        <p key={key} className="font-bold text-white mt-3 mb-1 leading-snug">
          {parseInline(line.slice(3), key)}
        </p>
      )
    }
    // ── H3 ───────────────────────────────────────────────────────────────────
    else if (/^### /.test(line)) {
      output.push(
        <p key={key} className="font-semibold text-white mt-2 mb-0.5 leading-snug">
          {parseInline(line.slice(4), key)}
        </p>
      )
    }
    // ── Horizontal rule ───────────────────────────────────────────────────────
    else if (/^---+$/.test(line.trim())) {
      output.push(<hr key={key} className="my-3 border-white/10" />)
    }
    // ── Unordered list ────────────────────────────────────────────────────────
    else if (/^[-*+] /.test(line)) {
      output.push(
        <div key={key} className="flex gap-2 my-0.5 leading-relaxed">
          <span className="flex-shrink-0 mt-[3px] w-3 text-center" style={{ color: '#6b7280' }}>•</span>
          <span>{parseInline(line.replace(/^[-*+] /, ''), key)}</span>
        </div>
      )
    }
    // ── Ordered list ──────────────────────────────────────────────────────────
    else if (/^\d+\. /.test(line)) {
      const num  = line.match(/^(\d+)\./)[1]
      const rest = line.replace(/^\d+\. /, '')
      output.push(
        <div key={key} className="flex gap-2 my-0.5 leading-relaxed">
          <span className="flex-shrink-0 mt-[3px] text-gray-500 text-[0.85em] font-mono w-4 text-right">{num}.</span>
          <span>{parseInline(rest, key)}</span>
        </div>
      )
    }
    // ── Blockquote ────────────────────────────────────────────────────────────
    else if (/^> /.test(line)) {
      output.push(
        <div
          key={key}
          className="pl-3 my-1 text-gray-400 italic text-[0.92em] leading-relaxed"
          style={{ borderLeft: '2px solid rgba(255,255,255,0.15)' }}
        >
          {parseInline(line.slice(2), key)}
        </div>
      )
    }
    // ── Empty line ────────────────────────────────────────────────────────────
    else if (line.trim() === '') {
      output.push(<div key={key} className="h-1.5" />)
    }
    // ── Regular paragraph ─────────────────────────────────────────────────────
    else {
      output.push(
        <p key={key} className="leading-relaxed my-0.5">
          {parseInline(line, key)}
        </p>
      )
    }

    i++
  }

  return <div className={`text-sm ${className}`}>{output}</div>
}
