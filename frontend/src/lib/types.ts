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