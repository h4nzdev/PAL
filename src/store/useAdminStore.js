import { create } from 'zustand'
import { supabase } from '../supabaseClient'

const useAdminStore = create((set) => ({
  stats:          null,
  usersWithUsage: [],
  recentMetrics:  [],
  loading:        false,
  error:          null,

  async loadOverviewStats() {
    set({ loading: true, error: null })
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalUsers },
      { count: totalJourneys },
      { count: totalTasks },
      { count: totalActivities },
      { data: usageRows },
    ] = await Promise.all([
      supabase.from('profiles')   .select('*', { count: 'exact', head: true }),
      supabase.from('journeys')   .select('*', { count: 'exact', head: true }),
      supabase.from('nodes')      .select('*', { count: 'exact', head: true }).eq('type', 'task'),
      supabase.from('activities') .select('*', { count: 'exact', head: true }),
      supabase.from('ai_usage')   .select('count').eq('date', today),
    ])

    const aiCallsToday = (usageRows || []).reduce((s, r) => s + (r.count || 0), 0)

    set({
      stats: { totalUsers, totalJourneys, totalTasks, totalActivities, aiCallsToday },
      loading: false,
    })
  },

  async loadUsersWithUsage() {
    set({ loading: true, error: null })
    const today = new Date().toISOString().split('T')[0]

    const [{ data: profiles, error: pErr }, { data: usage }] = await Promise.all([
      supabase.from('profiles').select('id, username, email, designation, is_banned, created_at').order('created_at'),
      supabase.from('ai_usage').select('user_id, count').eq('date', today),
    ])

    if (pErr) { set({ error: pErr.message, loading: false }); return }

    const usageMap = Object.fromEntries((usage || []).map(u => [u.user_id, u.count]))
    const merged   = (profiles || []).map(p => ({ ...p, aiUsageToday: usageMap[p.id] ?? 0 }))
    set({ usersWithUsage: merged, loading: false })
  },

  async loadRecentMetrics() {
    set({ loading: true, error: null })

    const [{ data: metrics, error: mErr }, { data: profiles }] = await Promise.all([
      supabase.from('client_metrics').select('*').order('reported_at', { ascending: false }).limit(200),
      supabase.from('profiles').select('id, username, email'),
    ])

    if (mErr) { set({ error: mErr.message, loading: false }); return }

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
    const merged     = (metrics || []).map(m => ({ ...m, profile: profileMap[m.user_id] || null }))
    set({ recentMetrics: merged, loading: false })
  },

  async banUser(userId, isBanned) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: isBanned })
      .eq('id', userId)

    if (!error) {
      set(s => ({
        usersWithUsage: s.usersWithUsage.map(u =>
          u.id === userId ? { ...u, is_banned: isBanned } : u
        ),
      }))
    }
    return error
  },

  async forceLogout(userId) {
    const { error } = await supabase
      .from('force_logout_requests')
      .insert({ user_id: userId })
    return error
  },
}))

export default useAdminStore
