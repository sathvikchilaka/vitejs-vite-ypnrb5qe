import type { Conversation, Message, User } from '../types/chat';

export const CURRENT_USER_ID = 'me';

export const users: User[] = [
  {
    id: 'me',
    name: 'You',
    avatar: '',
    online: true,
    color: '#6366f1',
  },
  {
    id: 'u1',
    name: 'Sarah Wilson',
    avatar: '',
    online: true,
    color: '#ec4899',
  },
  {
    id: 'u2',
    name: 'Alex Johnson',
    avatar: '',
    online: false,
    color: '#0ea5e9',
  },
  {
    id: 'u3',
    name: 'Emily Davis',
    avatar: '',
    online: true,
    color: '#f59e0b',
  },
  {
    id: 'u4',
    name: 'Michael Chen',
    avatar: '',
    online: false,
    color: '#10b981',
  },
  {
    id: 'u5',
    name: 'Jessica Brown',
    avatar: '',
    online: true,
    color: '#8b5cf6',
  },
];

const now = Date.now();

const minutesAgo = (minutes: number) => now - minutes * 60 * 1000;

export const initialConversations: Conversation[] = [
  {
    id: 'c1',
    name: 'Sarah Wilson',
    type: 'direct',
    memberIds: ['me', 'u1'],
    unreadCount: 2,
    lastMessageAt: minutesAgo(3),
  },
  {
    id: 'c2',
    name: 'Product Team',
    type: 'group',
    memberIds: ['me', 'u1', 'u2', 'u3'],
    unreadCount: 3,
    lastMessageAt: minutesAgo(12),
  },
  {
    id: 'c3',
    name: 'Alex Johnson',
    type: 'direct',
    memberIds: ['me', 'u2'],
    unreadCount: 0,
    lastMessageAt: minutesAgo(45),
  },
  {
    id: 'c4',
    name: 'Design Discussions',
    type: 'group',
    memberIds: ['me', 'u3', 'u4', 'u5'],
    unreadCount: 0,
    lastMessageAt: minutesAgo(120),
  },
  {
    id: 'c5',
    name: 'Emily Davis',
    type: 'direct',
    memberIds: ['me', 'u3'],
    unreadCount: 1,
    lastMessageAt: minutesAgo(240),
  },
];

export const initialMessages: Message[] = [
  {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u1',
    content: 'Hey! Have you checked the new designs?',
    createdAt: minutesAgo(35),
    status: 'read',
    reactions: [],
  },
  {
    id: 'm2',
    conversationId: 'c1',
    senderId: 'me',
    content: 'Yes! They look amazing. Really love the new direction.',
    createdAt: minutesAgo(30),
    status: 'read',
    reactions: [
      {
        emoji: '❤️',
        userIds: ['u1'],
      },
    ],
  },
  {
    id: 'm3',
    conversationId: 'c1',
    senderId: 'u1',
    content: 'Thanks! We spent a lot of time refining the details.',
    createdAt: minutesAgo(20),
    status: 'read',
    reactions: [],
  },
  {
    id: 'm4',
    conversationId: 'c1',
    senderId: 'u1',
    content: 'Are we still on for the review tomorrow?',
    createdAt: minutesAgo(3),
    status: 'delivered',
    reactions: [],
  },
  {
    id: 'm5',
    conversationId: 'c2',
    senderId: 'u2',
    content: 'Morning team! Sprint planning starts at 10.',
    createdAt: minutesAgo(60),
    status: 'read',
    reactions: [],
  },
  {
    id: 'm6',
    conversationId: 'c2',
    senderId: 'me',
    content: "Perfect. I've updated the backlog.",
    createdAt: minutesAgo(40),
    status: 'read',
    reactions: [],
  },
  {
    id: 'm7',
    conversationId: 'c2',
    senderId: 'u3',
    content: 'Great work everyone! 🚀',
    createdAt: minutesAgo(12),
    status: 'delivered',
    reactions: [],
  },
  {
    id: 'm8',
    conversationId: 'c3',
    senderId: 'u2',
    content: 'Can you share the latest API documentation?',
    createdAt: minutesAgo(45),
    status: 'read',
    reactions: [],
  },
  {
    id: 'm9',
    conversationId: 'c4',
    senderId: 'u4',
    content: 'The updated component library is ready!',
    createdAt: minutesAgo(120),
    status: 'read',
    reactions: [],
  },
  {
    id: 'm10',
    conversationId: 'c5',
    senderId: 'u3',
    content: 'Let me know when you are free to catch up.',
    createdAt: minutesAgo(240),
    status: 'delivered',
    reactions: [],
  },
];
