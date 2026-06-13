import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Sidebar from '../components/Layout/Sidebar'
import useProjectStore from '../store/useProjectStore'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Calendar() {
  const [current, setCurrent] = useState(() => new Date())
  const { journeys, nodes } = useProjectStore()

  const year = current.getFullYear()
  const month = current.getMonth()

  const allDueTasks = Object.entries(nodes).flatMap(([journeyId, jnodes]) => {
    const journey = journeys.find(j => j.id === journeyId)
    return (jnodes || []).filter(n => n.type === 'task' && n.dueDate).map(n => ({ ...n, journeyName: journey?.name }))
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  const tasksForDay = (day) => {
    if (!day) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return allDueTasks.filter(t => t.dueDate === dateStr)
  }

  const today = new Date()

  return (
    <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="md:ml-52 flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-white font-medium w-44 text-center">{MONTHS[month]} {year}</span>
            <button
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white/3 border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/5">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-3 text-center text-xs text-gray-500 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const tasks = tasksForDay(day)
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
              return (
                <div
                  key={i}
                  className="border-b border-r border-white/5 min-h-24 p-2 last:border-r-0"
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                          isToday ? 'bg-emerald-500 text-white font-semibold' : 'text-gray-400'
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {tasks.map(t => (
                          <div
                            key={t.id}
                            title={`${t.content} — ${t.journeyName}`}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${
                              t.checked
                                ? 'bg-gray-700/50 text-gray-500 line-through'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {t.content}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {allDueTasks.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-8">
            No tasks with due dates yet. Add due dates to tasks in your workspace.
          </p>
        )}
      </div>
      </main>
    </div>
  )
}
