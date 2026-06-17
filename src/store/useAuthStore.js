import { create } from 'zustand'
import { supabase } from '../supabaseClient'

const useAuthStore = create((set, get) => ({
  user:                  null,
  users:                 [],   // all profiles (for People tab)
  streak:                0,
  lastStreakDate:         null,
  loading:               true, // true until init() resolves
  isAdmin:               false,
  _forceLogoutChannel:   null,

  // Call once on app mount — restores session + populates store
  async init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get()._hydrateUser(session)
      get()._subscribeForceLogout(session.user.id)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await get()._hydrateUser(session)
        get()._subscribeForceLogout(session.user.id)
      } else {
        get()._unsubscribeForceLogout()
        set({ user: null, users: [], isAdmin: false })
      }
    })
  },

  // Opens a Realtime channel watching for admin-inserted force-logout rows
  _subscribeForceLogout(userId) {
    const existing = get()._forceLogoutChannel
    if (existing) supabase.removeChannel(existing)

    const ch = supabase
      .channel(`force-logout-${userId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'force_logout_requests',
        filter: `user_id=eq.${userId}`,
      }, async () => {
        await supabase.from('force_logout_requests').delete().eq('user_id', userId)
        await get().logout()
      })
      .subscribe()

    set({ _forceLogoutChannel: ch })
  },

  _unsubscribeForceLogout() {
    const ch = get()._forceLogoutChannel
    if (ch) { supabase.removeChannel(ch); set({ _forceLogoutChannel: null }) }
  },

  // Internal: populate user + users list from a Supabase session
  async _hydrateUser(session) {
    let { data: profile } = await supabase
      .from('profiles')
      .select('username, designation, streak, last_streak_date, is_banned')
      .eq('id', session.user.id)
      .maybeSingle()

    // First-time Google / OAuth users won't have a profile row yet
    if (!profile) {
      const meta = session.user.user_metadata || {}
      const username = (
        meta.full_name?.replace(/\s+/g, '').toLowerCase() ||
        meta.name?.replace(/\s+/g, '').toLowerCase() ||
        session.user.email?.split('@')[0] ||
        'user'
      )
      await supabase.from('profiles').insert({
        id:          session.user.id,
        username,
        email:       session.user.email,
        designation: '',
        streak:      0,
      })
      profile = { username, designation: '', streak: 0, last_streak_date: null, is_banned: false }
    }

    // Banned users are signed out immediately
    if (profile?.is_banned) {
      await supabase.auth.signOut()
      set({ user: null, loading: false, isAdmin: false })
      return
    }

    // Check admin status
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()

    set({
      isAdmin: !!adminRow,
      user: {
        id:          session.user.id,
        email:       session.user.email,
        username:    profile.username || session.user.user_metadata?.username || session.user.email,
        designation: profile.designation || '',
      },
      streak:         profile.streak          || 0,
      lastStreakDate: profile.last_streak_date || null,
    })

    // Load all profiles for the People / assign tab
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email, designation')
    set({ users: profiles || [] })
  },

  async register(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw new Error(error.message)

    // Create profile row (the user row in auth.users is created by Supabase)
    if (data.user) {
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email,
        designation: '',
        streak: 0,
      })
      if (profileErr) console.error('Profile insert failed:', profileErr)

      set({
        user: { id: data.user.id, email, username, designation: '' },
      })
    }
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    await get()._hydrateUser(data.session)
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw new Error(error.message)
    // Navigation is handled by the OAuth redirect — no navigate() needed here
  },

  async logout() {
    get()._unsubscribeForceLogout()
    await supabase.auth.signOut()
    set({ user: null, users: [], streak: 0, lastStreakDate: null, isAdmin: false })
  },

  async updateProfile(updates) {
    const { user } = get()
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (!error) set(s => ({ user: { ...s.user, ...updates } }))
  },

  async updateStreak() {
    const today = new Date().toDateString()
    const { lastStreakDate, streak, user } = get()
    if (lastStreakDate === today) return
    const yesterday  = new Date(Date.now() - 86400000).toDateString()
    const newStreak  = lastStreakDate === yesterday ? streak + 1 : 1
    set({ streak: newStreak, lastStreakDate: today })

    if (user) {
      supabase.from('profiles').update({
        streak:           newStreak,
        last_streak_date: today,
      }).eq('id', user.id).then(({ error }) => {
        if (error) console.error('Streak sync failed:', error)
      })
    }
  },
}))

export default useAuthStore
