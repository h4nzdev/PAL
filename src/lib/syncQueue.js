import { supabase } from '../supabaseClient'

const QUEUE_KEY = 'pal-sync-queue'

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function enqueue(entry) {
  const queue = getQueue()
  queue.push({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...entry })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export async function replayAll() {
  const queue = getQueue()
  if (!queue.length) return

  for (const entry of queue) {
    try {
      let query
      if (entry.op === 'insert') {
        query = supabase.from(entry.table).insert(entry.data)
      } else if (entry.op === 'update') {
        query = supabase.from(entry.table).update(entry.data).match(entry.filter)
      } else if (entry.op === 'delete') {
        query = supabase.from(entry.table).delete().match(entry.filter)
      }
      if (query) {
        const { error } = await query
        // 23505 = unique violation (already inserted) — safe to ignore
        if (error && !error.code?.includes('23505')) {
          console.error('Sync replay error:', error, entry)
        }
      }
    } catch (err) {
      console.error('Sync replay failed for entry:', entry, err)
    }
  }

  clearQueue()
}
