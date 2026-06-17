import { supabase } from '../supabaseClient'

const THROTTLE_KEY = 'pal-last-metric-report'
const THROTTLE_MS  = 60 * 60 * 1000 // at most once per hour

export async function reportMetrics(userId, force = false) {
  if (!userId) return

  if (!force) {
    const last = parseInt(localStorage.getItem(THROTTLE_KEY) || '0', 10)
    if (Date.now() - last < THROTTLE_MS) return
  }

  const memory    = performance?.memory
  const navEntry  = performance?.getEntriesByType?.('navigation')?.[0]
  const queueLen  = (() => {
    try { return JSON.parse(localStorage.getItem('pal-sync-queue') || '[]').length }
    catch { return 0 }
  })()

  const { error } = await supabase.from('client_metrics').insert({
    user_id:          userId,
    js_heap_used:     memory?.usedJSHeapSize  ?? null,
    js_heap_total:    memory?.totalJSHeapSize ?? null,
    page_load_ms:     navEntry?.loadEventEnd
      ? Math.round(navEntry.loadEventEnd - navEntry.fetchStart)
      : null,
    sync_queue_depth: queueLen,
  })

  if (!error) localStorage.setItem(THROTTLE_KEY, String(Date.now()))
  else console.error('clientMetrics:', error)
}
