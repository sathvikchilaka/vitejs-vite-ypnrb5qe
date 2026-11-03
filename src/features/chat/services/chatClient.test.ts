import { initialConversations, initialMessages } from '../data/mockData';
import { useChatStore } from '../store/useChatStore';

import { connect, disconnect, retryMessage, sendChatMessage } from './chatClient';

const status = (content: string) => useChatStore.getState().messages.find((m) => m.content === content)?.status;

describe('chat client (fake socket)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // never fails
    useChatStore.setState({
      conversations: JSON.parse(JSON.stringify(initialConversations)),
      messages: JSON.parse(JSON.stringify(initialMessages)),
      typingConversationIds: [],
      online: true,
    });
    connect();
    jest.advanceTimersByTime(300); // socket opens
  });

  afterEach(() => {
    disconnect();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('optimistic send moves through sending → sent → read and triggers a reply', () => {
    sendChatMessage('c1', 'ping');
    expect(status('ping')).toBe('sending');

    jest.advanceTimersByTime(1000);
    expect(status('ping')).toBe('sent');

    jest.advanceTimersByTime(2000);
    expect(status('ping')).toBe('read');

    jest.advanceTimersByTime(3000);
    const last = useChatStore.getState().messages.at(-1)!;
    expect(last.conversationId).toBe('c1');
    expect(last.senderId).not.toBe('me');
  });

  test('messages sent offline are queued and flushed on reconnect', () => {
    disconnect();
    sendChatMessage('c1', 'offline one');
    expect(status('offline one')).toBe('queued');

    connect();
    jest.advanceTimersByTime(300);
    expect(status('offline one')).toBe('sending');

    jest.advanceTimersByTime(1000);
    expect(status('offline one')).toBe('sent');
  });

  test('failed messages can be retried', () => {
    (Math.random as jest.Mock).mockReturnValue(0); // force failure
    sendChatMessage('c1', 'flaky');
    jest.advanceTimersByTime(1000);
    expect(status('flaky')).toBe('failed');

    (Math.random as jest.Mock).mockReturnValue(0.5);
    retryMessage(useChatStore.getState().messages.find((m) => m.content === 'flaky')!);
    jest.advanceTimersByTime(1000);
    expect(status('flaky')).toBe('sent');
  });
});
