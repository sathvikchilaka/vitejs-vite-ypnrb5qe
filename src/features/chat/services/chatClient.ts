import type { Attachment, Message } from '../types/chat';

import { CURRENT_USER_ID } from '../data/mockData';
import { useChatStore } from '../store/useChatStore';

import { FakeSocket, type ServerEvent } from './fakeSocket';


let socket: FakeSocket | null = null;
const store = () => useChatStore.getState();

function transmit(message: Message) {
  const conversation = store().conversations.find((c) => c.id === message.conversationId);
  const replyFrom = conversation?.memberIds.find((id) => id !== CURRENT_USER_ID);

  store().updateMessageStatus(message.id, 'sending');
  socket!.send(
    JSON.stringify({ type: 'message', id: message.id, conversationId: message.conversationId, replyFrom })
  );
}

function flushQueue() {
  store()
    .messages.filter((m) => m.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach(transmit);
}

function handle(event: ServerEvent) {
  const s = store();
  switch (event.type) {
    case 'ack':
      s.updateMessageStatus(event.id, 'sent');
      setTimeout(() => store().updateMessageStatus(event.id, 'delivered'), 700);
      setTimeout(() => store().updateMessageStatus(event.id, 'read'), 1800);
      break;
    case 'error':
      s.updateMessageStatus(event.id, 'failed');
      break;
    case 'typing':
      s.setTyping(event.conversationId, event.typing);
      break;
    case 'message': {
      const stillMember = s.conversations
        .find((c) => c.id === event.conversationId)
        ?.memberIds.includes(event.senderId);
      if (stillMember) s.receiveMessage(event.conversationId, event.senderId, event.content);
      break;
    }
  }
}

export function connect() {
  if (socket) return;
  const next = new FakeSocket();
  socket = next;
  next.onopen = () => {
    store().setOnline(true);
    flushQueue();
  };
  next.onmessage = ({ data }) => handle(JSON.parse(data));
  next.onclose = () => {
    // these won't get an ack now, put them back in the queue
    store().messages
      .filter((m) => m.status === 'sending')
      .forEach((m) => store().updateMessageStatus(m.id, 'queued'));
    store().typingConversationIds.forEach((id) => store().setTyping(id, false));
  };
}

export function disconnect() {
  store().setOnline(false);
  socket?.close();
  socket = null;
}

export function setNetwork(online: boolean) {
  if (online) connect();
  else disconnect();
}

export function sendChatMessage(
  conversationId: string,
  content: string,
  replyToId?: string,
  attachments?: Attachment[]
) {
  const message = store().sendMessage(conversationId, content, replyToId, attachments);
  if (socket?.readyState === FakeSocket.OPEN) transmit(message);
  else store().updateMessageStatus(message.id, 'queued');
}

export function retryMessage(message: Message) {
  if (socket?.readyState === FakeSocket.OPEN) transmit(message);
  else store().updateMessageStatus(message.id, 'queued');
}

export function startRealtime() {
  const onOnline = () => setNetwork(true);
  const onOffline = () => setNetwork(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  setNetwork(navigator.onLine);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    disconnect();
  };
}
