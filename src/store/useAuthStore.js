import { create } from 'zustand'
import { supabase } from '../supabaseClient'

const useAuthStore = create((set, get) => ({
  user:            null,
  users:           [],   // all profiles (for People tab)
  streak:          0,
  lastStreakDate:  null,
  loading:         true, // true until init() resolves

  // Call once on app mount — restores session + populates store
  async init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get()._hydrateUser(session)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await get()._hydrateUser(session)
      } else {
        set({ user: null, users: [] })
      }
    })
  },

  // Internal: populate user + users list from a Supabase session
  async _hydrateUser(session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, designation, streak, last_streak_date')
      .eq('id', session.user.id)
      .maybeSingle()

    set({
      user: {
        id:          session.user.id,
        email:       session.user.email,
        username:    profile?.username || session.user.user_metadata?.username || session.user.email,
        designation: profile?.designation || '',
      },
      streak:         profile?.streak          || 0,
      lastStreakDate: profile?.last_streak_date || null,
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

  async logout() {
    await supabase.auth.signOut()
    set({ user: null, users: [], streak: 0, lastStreakDate: null })
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
