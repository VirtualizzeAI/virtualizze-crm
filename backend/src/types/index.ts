export type UserRole = 'admin' | 'supervisor' | 'agent'
export type TeamAccessType = 'all_contacts' | 'assigned_only' | 'team_only'
export type ContactType = 'PF' | 'PJ'
export type DealStatus = 'open' | 'won' | 'lost'
export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type WhatsAppInstanceType = 'official' | 'unofficial'
export type WhatsAppInstanceStatus = 'connected' | 'disconnected' | 'qr_pending'
export type ConversationStatus = 'open' | 'pending' | 'resolved'
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'
export type ContactCreatedByType = 'user' | 'automation'

export interface BaseEntity {
  id: string
  organization_id: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
}

export interface User extends BaseEntity {
  name: string
  avatar_url: string | null
  role: UserRole
}

export interface Team extends BaseEntity {
  name: string
  description: string | null
  access_type: TeamAccessType
}

export interface TeamMember extends BaseEntity {
  team_id: string
  user_id: string
  role: 'leader' | 'member'
}

export interface Contact extends BaseEntity {
  type: ContactType | null
  name: string
  document: string | null
  phone: string | null
  email: string | null
  description: string | null
  street: string | null
  street_number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  complement: string | null
  reference: string | null
  assigned_user_id: string | null
  assigned_team_id: string | null
  created_by_type: ContactCreatedByType
  created_by_user_id: string | null
  tags: string[]
  updated_at: string
}

export interface ContactCustomField extends BaseEntity {
  contact_id: string
  field_key: string
  field_value: string | null
}

export interface ContactNote extends BaseEntity {
  contact_id: string
  title: string
  content: string
  attachment_url: string | null
  created_by_type: ContactCreatedByType
  created_by_user_id: string | null
}

export interface ContactAttachment extends BaseEntity {
  contact_id: string
  note_id: string | null
  file_name: string
  file_url: string
  source: 'standalone' | 'note'
  uploaded_by_user_id: string | null
}

export interface ContactTimelineEvent extends BaseEntity {
  contact_id: string
  event_type: 'contact_created' | 'contact_updated' | 'note_created' | 'attachment_added' | 'custom_field_updated'
  description: string
  actor_type: ContactCreatedByType
  actor_user_id: string | null
  metadata: Record<string, string | number | boolean | null>
}

export interface ContactDealSummary {
  id: string
  name: string
  stage_id: string
  status: DealStatus
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

export interface Pipeline extends BaseEntity {
  name: string
  description: string | null
  is_active: boolean
}

export interface PipelineStage extends BaseEntity {
  pipeline_id: string
  name: string
  position: number
  color: string | null
  description: string | null
}

export interface Deal extends BaseEntity {
  pipeline_id: string
  stage_id: string
  name: string
  contact_id: string | null
  phone: string | null
  email: string | null
  description: string | null
  notes: string | null
  value: number
  responsible_user_id: string | null
  responsible_team_id: string | null
  tags: string[]
  position: number
  status: DealStatus
  lost_reason: string | null
  won_at: string | null
  lost_at: string | null
  updated_at: string
}

export interface Task extends BaseEntity {
  name: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  responsible_id: string | null
  team_id: string | null
  contact_id: string | null
  deal_id: string | null
  due_date: string | null
}

export interface Product extends BaseEntity {
  name: string
  description: string | null
  value: number
  unit: string | null
  category: string | null
  stock: number
  promo_type: 'percent' | 'fixed' | null
  promo_value: number | null
  is_active: boolean
}

export interface Conversation extends BaseEntity {
  instance_id: string
  contact_id: string
  assigned_user_id: string | null
  assigned_team_id: string | null
  status: ConversationStatus
  tags: string[]
  notes: string | null
  unread_count: number
  last_message_at: string | null
}

export interface Message extends BaseEntity {
  conversation_id: string
  from_me: boolean
  message_type: MessageType
  content: string | null
  media_url: string | null
  media_mime: string | null
  file_name: string | null
  duration: number | null
  status: MessageStatus | null
  whatsapp_id: string | null
}

export interface AuthenticatedUser {
  sub: string
  email?: string
  role?: string
  organization_id: string
}