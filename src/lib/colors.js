// Journey accent colors — full class strings so Tailwind includes them
export const JOURNEY_COLORS = ['emerald', 'amber', 'violet', 'blue', 'rose', 'cyan']

export const COLOR_HEX = {
  emerald: '#10b981',
  amber:   '#f59e0b',
  violet:  '#8b5cf6',
  blue:    '#3b82f6',
  rose:    '#f43f5e',
  cyan:    '#06b6d4',
}

// Static lookup keeps Tailwind from purging these classes
export const COLOR_CLASSES = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400'   },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  dot: 'bg-violet-400'  },
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    dot: 'bg-blue-400'    },
  rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    dot: 'bg-rose-400'    },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    dot: 'bg-cyan-400'    },
}
