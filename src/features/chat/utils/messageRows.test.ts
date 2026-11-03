import type { Message } from '../types/chat';

import { buildRows } from './messageRows';

const now = new Date('2026-11-03T12:00:00');
const msg = (id: string, iso: string): Message => ({
  id,
  conversationId: 'c1',
  senderId: 'me',
  content: id,
  createdAt: new Date(iso).getTime(),
  status: 'read',
  reactions: [],
});

test('groups messages under date separators', () => {
  const rows = buildRows(
    [msg('a', '2026-11-01T09:00:00'), msg('b', '2026-11-02T09:00:00'), msg('c', '2026-11-03T09:00:00'), msg('d', '2026-11-03T10:00:00')],
    now
  );

  expect(rows.map((r) => (r.kind === 'date' ? r.label : r.id))).toEqual([
    'November 1, 2026',
    'a',
    'Yesterday',
    'b',
    'Today',
    'c',
    'd',
  ]);
});

test('marks first message of each sender run', () => {
  const other = { ...msg('y', '2026-11-03T09:01:00'), senderId: 'u1' };
  const rows = buildRows([msg('x', '2026-11-03T09:00:00'), other, msg('z', '2026-11-03T09:02:00'), msg('w', '2026-11-03T09:03:00')], now);
  expect(rows.flatMap((r) => (r.kind === 'message' ? [r.first] : []))).toEqual([true, true, true, false]);
});
