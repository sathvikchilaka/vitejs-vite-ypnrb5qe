export type MessageStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type ConversationType = 'direct' | 'group';

export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  color?: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  status: MessageStatus;
  replyToId?: string;
  reactions: Reaction[];
  attachments?: Attachment[];
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  type: ConversationType;
  avatar?: string;
  memberIds: string[];
  unreadCount: number;
  lastMessageAt: number;
}

export type ConversationFilter = 'all' | 'unread' | 'groups';
