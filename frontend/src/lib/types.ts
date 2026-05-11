export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'agent'
  avatar_url?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthSession {
  token: string
  organization_id: string
  user: AuthUser
}

export interface AuthProfile {
  organization_id: string
  user: AuthUser
}

export type TeamAccessType = 'all_contacts' | 'assigned_only' | 'team_only'

export interface Team {
  id: string
  organization_id: string
  name: string
  description: string | null
  access_type: TeamAccessType
  created_at: string
}

export interface UserSummary {
  id: string
  organization_id: string
  name: string
  role: 'admin' | 'supervisor' | 'agent'
  avatar_url: string | null
  created_at: string
}

export interface TeamMember {
  id: string
  organization_id: string
  team_id: string
  user_id: string
  role: 'leader' | 'member'
  created_at: string
  user: {
    id: string
    name: string
    role: string
    avatar_url: string | null
  } | null
}

export interface Pipeline {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface PipelineStage {
  id: string
  organization_id: string
  pipeline_id: string
  name: string
  position: number
  color: string | null
  description: string | null
  created_at: string
}

export interface Deal {
  id: string
  organization_id: string
  pipeline_id: string
  stage_id: string
  name: string
  contact_id: string | null
  value: number
  description: string | null
  position: number
  status: 'open' | 'won' | 'lost'
  created_at: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  responsible_id: string | null
  team_id: string | null
  contact_id: string | null
  deal_id: string | null
  due_date: string | null
  attachment_urls: string[]
  created_at: string
  responsible: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  contact: {
    id: string
    name: string
    phone: string | null
  } | null
}

export type ContactType = 'PF' | 'PJ'
export type ContactCreatedByType = 'user' | 'automation'

export interface Contact {
  id: string
  organization_id: string
  type: ContactType | null
  name: string
  phone: string | null
  email: string | null
  description: string | null
  street: string | null
  street_number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  country: string | null
  complement: string | null
  reference: string | null
  assigned_user_id: string | null
  created_by_type: ContactCreatedByType
  created_by_user_id: string | null
  created_at: string
  updated_at: string
}

export interface ContactCustomField {
  id: string
  organization_id: string
  contact_id: string
  field_key: string
  field_value: string | null
  created_at: string
}

export interface ContactNote {
  id: string
  organization_id: string
  contact_id: string
  title: string
  content: string
  attachment_url: string | null
  created_by_type: ContactCreatedByType
  created_by_user_id: string | null
  created_at: string
}

export interface ContactAttachment {
  id: string
  organization_id: string
  contact_id: string
  note_id: string | null
  file_name: string
  file_url: string
  source: 'standalone' | 'note'
  uploaded_by_user_id: string | null
  created_at: string
}

export interface ContactTimelineEvent {
  id: string
  organization_id: string
  contact_id: string
  event_type: 'contact_created' | 'contact_updated' | 'note_created' | 'attachment_added' | 'custom_field_updated'
  description: string
  actor_type: ContactCreatedByType
  actor_user_id: string | null
  metadata: Record<string, string | number | boolean | null>
  created_at: string
}

export interface ContactDealSummary {
  id: string
  name: string
  stage_id: string
  status: Deal['status']
  value: number
  created_at: string
}

export interface ContactProductHistoryItem {
  deal_id: string
  deal_name: string
  product_id: string
  product_name: string
  unit: string | null
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  created_at: string
}

export interface ContactDetails {
  contact: Contact
  custom_fields: ContactCustomField[]
  notes: ContactNote[]
  attachments: ContactAttachment[]
  timeline: ContactTimelineEvent[]
  linked_deals: ContactDealSummary[]
  product_history: ContactProductHistoryItem[]
}

export interface ChatConversation {
  id: string
  contact_id: string
  instance_id: string
  status: 'open' | 'pending' | 'resolved'
  tags: string[]
  last_message_at: string | null
  unread_count: number
}

export interface ChatMessage {
  id: string
  conversation_id: string
  from_me: boolean
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker'
  content: string | null
  media_url?: string | null
  created_at: string
}