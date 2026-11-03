import type { Message } from '../types/chat';

export type Row =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: Message; first: boolean };

export function getDateLabel(timestamp: number, now = new Date()) {
  const date = new Date(timestamp);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export function buildRows(messages: Message[], now = new Date()): Row[] {
  const rows: Row[] = [];
  let previousDay = '';
  let previousSender = '';

  for (const message of messages) {
    const day = new Date(message.createdAt).toDateString();
    if (day !== previousDay) {
      rows.push({ kind: 'date', id: `date-${day}`, label: getDateLabel(message.createdAt, now) });
      previousDay = day;
      previousSender = '';
    }
    rows.push({ kind: 'message', id: message.id, message, first: message.senderId !== previousSender });
    previousSender = message.senderId;
  }

  return rows;
}

export const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
