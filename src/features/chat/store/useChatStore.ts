import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Attachment,
  Conversation,
  ConversationFilter,
  Message,
  MessageStatus,
} from '../types/chat';

import {
  CURRENT_USER_ID,
  initialConversations,
  initialMessages,
} from '../data/mockData';
import { chatStorage } from '../../../shared/utils/idbStorage';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  selectedConversationId: string | null;
  filter: ConversationFilter;
  typingConversationIds: string[];
  theme: 'light' | 'dark';
  online: boolean;
  hydrated: boolean;

  selectConversation: (id: string | null) => void;
  setFilter: (filter: ConversationFilter) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    attachments?: Attachment[]
  ) => Message;
  receiveMessage: (conversationId: string, senderId: string, content: string) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  setTyping: (conversationId: string, typing: boolean) => void;
  addMember: (conversationId: string, userId: string) => void;
  removeMember: (conversationId: string, userId: string) => void;
  toggleTheme: () => void;
  setOnline: (online: boolean) => void;
  seedMessages: (conversationId: string, count: number) => void;
}

const createId = () => crypto.randomUUID();

const touch = (conversations: Conversation[], id: string, patch: Partial<Conversation>) =>
  conversations.map((c) => (c.id === id ? { ...c, ...patch } : c));

const mapMessage = (messages: Message[], id: string, fn: (m: Message) => Message) =>
  messages.map((m) => (m.id === id ? fn(m) : m));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: initialConversations,
      messages: initialMessages,
      selectedConversationId: 'c1',
      filter: 'all',
      typingConversationIds: [],
      theme: 'light',
      online: true,
      hydrated: false,

      selectConversation: (id) =>
        set((state) => ({
          selectedConversationId: id,
          conversations: id ? touch(state.conversations, id, { unreadCount: 0 }) : state.conversations,
        })),

      setFilter: (filter) => set({ filter }),

      sendMessage: (conversationId, content, replyToId, attachments) => {
        const message: Message = {
          id: createId(),
          conversationId,
          senderId: CURRENT_USER_ID,
          content,
          createdAt: Date.now(),
          status: get().online ? 'sending' : 'queued',
          replyToId,
          attachments,
          reactions: [],
        };

        set((state) => ({
          messages: [...state.messages, message],
          conversations: touch(state.conversations, conversationId, {
            lastMessageAt: message.createdAt,
          }),
        }));

        return message;
      },

      receiveMessage: (conversationId, senderId, content) => {
        const message: Message = {
          id: createId(),
          conversationId,
          senderId,
          content,
          createdAt: Date.now(),
          status: 'delivered',
          reactions: [],
        };

        set((state) => {
          const conversation = state.conversations.find((c) => c.id === conversationId);
          const isOpen = state.selectedConversationId === conversationId;

          return {
            messages: [...state.messages, message],
            conversations: touch(state.conversations, conversationId, {
              lastMessageAt: message.createdAt,
              unreadCount: isOpen ? 0 : (conversation?.unreadCount ?? 0) + 1,
            }),
          };
        });
      },

      updateMessageStatus: (messageId, status) =>
        set((state) => ({
          messages: mapMessage(state.messages, messageId, (m) => ({ ...m, status })),
        })),

      editMessage: (messageId, content) =>
        set((state) => ({
          messages: mapMessage(state.messages, messageId, (m) =>
            m.senderId === CURRENT_USER_ID && !m.deleted
              ? { ...m, content, updatedAt: Date.now() }
              : m
          ),
        })),

      deleteMessage: (messageId) =>
        set((state) => ({
          messages: mapMessage(state.messages, messageId, (m) =>
            m.senderId === CURRENT_USER_ID
              ? { ...m, deleted: true, content: '', reactions: [], attachments: [] }
              : m
          ),
        })),

      toggleReaction: (messageId, emoji) =>
        set((state) => ({
          messages: mapMessage(state.messages, messageId, (m) => {
            if (m.deleted) return m;

            const existing = m.reactions.find((r) => r.emoji === emoji);
            if (!existing) {
              return { ...m, reactions: [...m.reactions, { emoji, userIds: [CURRENT_USER_ID] }] };
            }

            const userIds = existing.userIds.includes(CURRENT_USER_ID)
              ? existing.userIds.filter((id) => id !== CURRENT_USER_ID)
              : [...existing.userIds, CURRENT_USER_ID];

            return {
              ...m,
              reactions: userIds.length
                ? m.reactions.map((r) => (r.emoji === emoji ? { ...r, userIds } : r))
                : m.reactions.filter((r) => r.emoji !== emoji),
            };
          }),
        })),

      setTyping: (conversationId, typing) =>
        set((state) => ({
          typingConversationIds: typing
            ? [...new Set([...state.typingConversationIds, conversationId])]
            : state.typingConversationIds.filter((id) => id !== conversationId),
        })),

      addMember: (conversationId, userId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId && c.type === 'group'
              ? { ...c, memberIds: [...new Set([...c.memberIds, userId])] }
              : c
          ),
        })),

      removeMember: (conversationId, userId) => {
        if (userId === CURRENT_USER_ID) return;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId && c.type === 'group'
              ? { ...c, memberIds: c.memberIds.filter((id) => id !== userId) }
              : c
          ),
        }));
      },

      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      setOnline: (online) => set({ online }),

      seedMessages: (conversationId, count) => {
        const conversation = get().conversations.find((c) => c.id === conversationId);
        if (!conversation) return;

        const start = Date.now() - count * 60_000;
        const seeded: Message[] = Array.from({ length: count }, (_, i) => ({
          id: `seed-${conversationId}-${start}-${i}`,
          conversationId,
          senderId: conversation.memberIds[i % conversation.memberIds.length],
          content: `Load-test message #${i + 1}${i % 7 === 0 ? '\nwith a second line to vary row height' : ''}`,
          createdAt: start + i * 60_000,
          status: 'read',
          reactions: [],
        }));

        set((state) => ({ messages: [...seeded, ...state.messages] }));
      },
    }),
    {
      name: 'pulse-chat-storage',
      storage: createJSONStorage(() => chatStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // anything still sending when the page closed goes back to the queue
        const { selectedConversationId, conversations } = useChatStore.getState();
        useChatStore.setState({
          hydrated: true,
          conversations: conversations.map((c) => (c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c)),
          messages: (state?.messages ?? useChatStore.getState().messages).map((m) =>
            m.status === 'sending' ? { ...m, status: 'queued' } : m
          ),
        });
      },
    }
  )
);
