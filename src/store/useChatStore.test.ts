import { useChatStore } from './useChatStore';
import { initialConversations, initialMessages } from '../data/mockData';

describe('Chat Store', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: JSON.parse(JSON.stringify(initialConversations)),
      messages: JSON.parse(JSON.stringify(initialMessages)),
      selectedConversationId: 'c1',
      filter: 'all',
      search: '',
      messageSearch: '',
      typingConversationIds: [],
      theme: 'light',
    });
  });

  test('should send a new message', () => {
    const initialCount = useChatStore.getState().messages.length;

    const messageId = useChatStore.getState().sendMessage('c1', 'Hello Jest!');

    const state = useChatStore.getState();

    expect(state.messages).toHaveLength(initialCount + 1);

    expect(
      state.messages.find((message) => message.id === messageId)
    ).toMatchObject({
      conversationId: 'c1',
      senderId: 'me',
      content: 'Hello Jest!',
      status: 'sending',
    });
  });
});
