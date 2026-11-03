import { useChatStore } from '../store/useChatStore';
import { CURRENT_USER_ID } from '../data/mockData';

const responses = [
  'That sounds great! 🙌',
  'Absolutely, let me check.',
  'Thanks for sharing!',
  'I completely agree with you.',
  'Perfect! Let’s do it.',
  'Interesting! Tell me more.',
  'Haha, that’s awesome 😂',
];

const randomResponse = () =>
  responses[Math.floor(Math.random() * responses.length)];

export function simulateMessageDelivery(messageId: string) {
  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(messageId, 'sent');
  }, 500);

  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(messageId, 'delivered');
  }, 1200);

  setTimeout(() => {
    useChatStore.getState().updateMessageStatus(messageId, 'read');
  }, 2500);
}

export function simulateIncomingMessage(conversationId: string) {
  const state = useChatStore.getState();

  const conversation = state.conversations.find(
    (conversation) => conversation.id === conversationId
  );

  if (!conversation) return;

  const senderId = conversation.memberIds.find((id) => id !== CURRENT_USER_ID);

  if (!senderId) return;

  setTimeout(() => {
    useChatStore.getState().setTyping(conversationId, true);

    setTimeout(() => {
      const currentState = useChatStore.getState();

      const stillMember = currentState.conversations
        .find((conversation) => conversation.id === conversationId)
        ?.memberIds.includes(senderId);

      currentState.setTyping(conversationId, false);

      if (stillMember) {
        currentState.receiveMessage(conversationId, senderId, randomResponse());
      }
    }, 1800);
  }, 1200);
}
