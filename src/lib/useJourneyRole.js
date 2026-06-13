import { useShallow } from 'zustand/react/shallow'
import useProjectStore from '../store/useProjectStore'
import useAuthStore from '../store/useAuthStore'

/**
 * Returns the current user's role in a journey.
 * Falls back to 'viewer' if not found.
 */
export function useJourneyRole(journeyId) {
  const user    = useAuthStore(s => s.user)
  const journey = useProjectStore(useShallow(s => s.journeys.find(j => j.id === journeyId)))
  const members = useProjectStore(useShallow(s => s.teamMembers[journeyId] || []))

  if (!user) return 'viewer'
  if (journey?.ownerId === user.id) return 'owner'
  const member = members.find(m => m.userId === user.id)
  return member?.role || 'viewer'
}

/** owner + editor can check tasks, rename, delete */
export const canEdit   = role => role === 'owner' || role === 'editor'

/** owner + editor + uploader can add new tasks */
export const canUpload = role => role === 'owner' || role === 'editor' || role === 'uploader'
