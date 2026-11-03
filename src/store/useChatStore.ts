import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Conversation, ConversationFilter, Message } from '../types/chat';

import {
  CURRENT_USER_ID,
  initialConversations,
  initialMessages,
} from '../data/mockData';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];

  selectedConversationId: string | null;

  filter: ConversationFilter;
  search: string;
  messageSearch: string;

  typingConversationIds: string[];

  theme: 'light' | 'dark';

  selectConversation: (id: string | null) => void;

  setFilter: (filter: ConversationFilter) => void;
  setSearch: (search: string) => void;
  setMessageSearch: (search: string) => void;

  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string
  ) => string;

  receiveMessage: (
    conversationId: string,
    senderId: string,
    content: string
  ) => void;

  updateMessageStatus: (messageId: string, status: Message['status']) => void;

  editMessage: (messageId: string, content: string) => void;

  deleteMessage: (messageId: string) => void;

  toggleReaction: (messageId: string, emoji: string) => void;

  setTyping: (conversationId: string, typing: boolean) => void;

  addMember: (conversationId: string, userId: string) => void;

  removeMember: (conversationId: string, userId: string) => void;

  toggleTheme: () => void;
}

const createId = () => crypto.randomUUID();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: initialConversations,
      messages: initialMessages,

      selectedConversationId: 'c1',

      filter: 'all',
      search: '',
      messageSearch: '',

      typingConversationIds: [],

      theme: 'light',

      selectConversation: (id) => {
        set((state) => ({
          selectedConversationId: id,
          messageSearch: '',
          conversations: state.conversations.map((conversation) =>
            conversation.id === id
              ? { ...conversation, unreadCount: 0 }
              : conversation
          ),
          messages: state.messages.map((message) =>
            message.conversationId === id &&
            message.senderId === CURRENT_USER_ID &&
            message.status !== 'sending'
              ? { ...message, status: 'read' }
              : message
          ),
        }));
      },

      setFilter: (filter) => set({ filter }),

      setSearch: (search) => set({ search }),

      setMessageSearch: (messageSearch) => set({ messageSearch }),

      sendMessage: (conversationId, content, replyToId) => {
        const id = createId();
        const timestamp = Date.now();

        const message: Message = {
          id,
          conversationId,
          senderId: CURRENT_USER_ID,
          content,
          createdAt: timestamp,
          status: 'sending',
          replyToId,
          reactions: [],
        };

        set((state) => ({
          messages: [...state.messages, message],

          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessageAt: timestamp,
                }
              : conversation
          ),
        }));

        return id;
      },

      receiveMessage: (conversationId, senderId, content) => {
        const timestamp = Date.now();

        const message: Message = {
          id: createId(),
          conversationId,
          senderId,
          content,
          createdAt: timestamp,
          status: 'delivered',
          reactions: [],
        };

        set((state) => ({
          messages: [...state.messages, message],

          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessageAt: timestamp,
                  unreadCount:
                    state.selectedConversationId === conversationId
                      ? 0
                      : conversation.unreadCount + 1,
                }
              : conversation
          ),
        }));
      },

      updateMessageStatus: (messageId, status) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId ? { ...message, status } : message
          ),
        }));
      },

      editMessage: (messageId, content) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId &&
            message.senderId === CURRENT_USER_ID &&
            !message.deleted
              ? {
                  ...message,
                  content,
                  updatedAt: Date.now(),
                }
              : message
          ),
        }));
      },

      deleteMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId && message.senderId === CURRENT_USER_ID
              ? {
                  ...message,
                  deleted: true,
                  content: '',
                  reactions: [],
                }
              : message
          ),
        }));
      },

      toggleReaction: (messageId, emoji) => {
        set((state) => ({
          messages: state.messages.map((message) => {
            if (message.id !== messageId || message.deleted) {
              return message;
            }

            const reactions = [...message.reactions];

            const index = reactions.findIndex(
              (reaction) => reaction.emoji === emoji
            );

            if (index === -1) {
              reactions.push({
                emoji,
                userIds: [CURRENT_USER_ID],
              });
            } else {
              const reaction = reactions[index];

              const alreadyReacted = reaction.userIds.includes(CURRENT_USER_ID);

              const userIds = alreadyReacted
                ? reaction.userIds.filter((id) => id !== CURRENT_USER_ID)
                : [...reaction.userIds, CURRENT_USER_ID];

              if (userIds.length === 0) {
                reactions.splice(index, 1);
              } else {
                reactions[index] = {
                  ...reaction,
                  userIds,
                };
              }
            }

            return { ...message, reactions };
          }),
        }));
      },

      setTyping: (conversationId, typing) => {
        set((state) => ({
          typingConversationIds: typing
            ? [...new Set([...state.typingConversationIds, conversationId])]
            : state.typingConversationIds.filter((id) => id !== conversationId),
        }));
      },

      addMember: (conversationId, userId) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId && conversation.type === 'group'
              ? {
                  ...conversation,
                  memberIds: [...new Set([...conversation.memberIds, userId])],
                }
              : conversation
          ),
        }));
      },

      removeMember: (conversationId, userId) => {
        if (userId === CURRENT_USER_ID) return;

        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId && conversation.type === 'group'
              ? {
                  ...conversation,
                  memberIds: conversation.memberIds.filter(
                    (id) => id !== userId
                  ),
                }
              : conversation
          ),
        }));
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },
    }),
    {
      name: 'pulse-chat-storage',

      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        theme: state.theme,
      }),
    }
  )
);
