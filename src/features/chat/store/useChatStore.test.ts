import { useChatStore } from './useChatStore';
import { initialConversations, initialMessages } from '../data/mockData';

const reset = (online = true) =>
  useChatStore.setState({
    conversations: JSON.parse(JSON.stringify(initialConversations)),
    messages: JSON.parse(JSON.stringify(initialMessages)),
    selectedConversationId: 'c1',
    typingConversationIds: [],
    online,
  });

const find = (id: string) => useChatStore.getState().messages.find((m) => m.id === id)!;

describe('chat store', () => {
  beforeEach(() => reset());

  test('adds a message optimistically as "sending" when online', () => {
    const message = useChatStore.getState().sendMessage('c1', 'Hello');
    expect(find(message.id)).toMatchObject({ content: 'Hello', senderId: 'me', status: 'sending' });
  });

  test('queues the message when offline', () => {
    reset(false);
    const message = useChatStore.getState().sendMessage('c1', 'Later');
    expect(find(message.id).status).toBe('queued');
  });

  test('toggles a reaction on and off', () => {
    const { toggleReaction } = useChatStore.getState();
    toggleReaction('m1', '👍');
    expect(find('m1').reactions).toEqual([{ emoji: '👍', userIds: ['me'] }]);
    toggleReaction('m1', '👍');
    expect(find('m1').reactions).toEqual([]);
  });

  test('only own messages can be edited or deleted', () => {
    const { editMessage, deleteMessage } = useChatStore.getState();
    editMessage('m1', 'hacked');
    deleteMessage('m1');
    expect(find('m1')).toMatchObject({ content: initialMessages[0].content });
    expect(find('m1').deleted).toBeUndefined();
  });

  test('increments unread only for conversations that are not open', () => {
    const { receiveMessage } = useChatStore.getState();
    const before = useChatStore.getState().conversations.find((c) => c.id === 'c2')!.unreadCount;
    receiveMessage('c2', 'u2', 'hi');
    receiveMessage('c1', 'u1', 'hi');
    const conversations = useChatStore.getState().conversations;
    expect(conversations.find((c) => c.id === 'c2')!.unreadCount).toBe(before + 1);
    expect(conversations.find((c) => c.id === 'c1')!.unreadCount).toBe(0);
  });

  test('seeds 10,000 messages', () => {
    const before = useChatStore.getState().messages.length;
    useChatStore.getState().seedMessages('c1', 10_000);
    expect(useChatStore.getState().messages).toHaveLength(before + 10_000);
  });
});
