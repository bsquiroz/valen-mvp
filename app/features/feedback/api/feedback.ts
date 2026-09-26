import { getSupabase } from '@/lib/supabase'
import type { FeedbackEntry, FeedbackForm, FeedbackStatus } from '../data/feedback'
import { mapFeedbackEntries } from '../data/feedback'

// Una escritura por envío. La base limita a 10 por usuario por hora.
export async function submitFeedback(form: FeedbackForm, context: { page: string, userAgent: string }): Promise<void> {
  const { error } = await getSupabase().rpc('submit_feedback', {
    p_type: form.type,
    p_message: form.message,
    p_page: context.page,
    p_user_agent: context.userAgent,
  })
  if (error) throw error
}

// Solo super admin (la RPC lo verifica)
export async function fetchFeedback(): Promise<FeedbackEntry[]> {
  const { data, error } = await getSupabase().rpc('super_admin_list_feedback')
  if (error) throw error
  return mapFeedbackEntries(data)
}

export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const { error } = await getSupabase().rpc('super_admin_set_feedback_status', { p_id: id, p_status: status })
  if (error) throw error
}
