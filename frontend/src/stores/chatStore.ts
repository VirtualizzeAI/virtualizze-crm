import { create } from 'zustand'

import type { ChatConversation, ChatMessage } from '../lib/types'

interface ChatState {
  activeConversationId: string | null
  conversations: ChatConversation[]
  messages: Record<string, ChatMessage[]>
  setActiveConversationId: (conversationId: string | null) => void
  setConversations: (conversations: ChatConversation[]) => void
  setMessages: (conversationId: string, messages: ChatMessage[]) => void
  appendMessage: (message: ChatMessage) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  conversations: [],
  messages: {},
  setActiveConversationId: (conversationId) => {
    set({ activeConversationId: conversationId })
  },
  setConversations: (conversations) => {
    set({ conversations })
  },
  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }))
  },
  appendMessage: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversation_id]: [...(state.messages[message.conversation_id] ?? []), message],
      },
    }))
  },
  reset: () => {
    set({ activeConversationId: null, conversations: [], messages: {} })
  },
}))