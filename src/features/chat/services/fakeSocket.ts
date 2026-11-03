// A tiny in-browser stand-in for a WebSocket server. Same shape as the
// browser WebSocket API (readyState, send, close, onopen/onclose/onmessage),
// so swapping in `new WebSocket(url)` later only touches chatClient.ts.

export type ClientEvent = {
  type: 'message';
  id: string;
  conversationId: string;
  replyFrom?: string;
};

export type ServerEvent =
  | { type: 'ack'; id: string }
  | { type: 'error'; id: string }
  | { type: 'typing'; conversationId: string; typing: boolean }
  | { type: 'message'; conversationId: string; senderId: string; content: string };

const REPLIES = [
  'That sounds great! 🙌',
  'Absolutely, let me check.',
  'Thanks for sharing!',
  'I completely agree with you.',
  'Perfect! Let’s do it.',
  'Haha, that’s awesome 😂',
];

export const FAILURE_RATE = 0.1;

export class FakeSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = FakeSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    this.later(300, () => {
      this.readyState = FakeSocket.OPEN;
      this.onopen?.();
    });
  }

  send(data: string) {
    if (this.readyState !== FakeSocket.OPEN) throw new Error('Socket is not open');

    const event = JSON.parse(data) as ClientEvent;
    const failed = Math.random() < FAILURE_RATE;

    this.later(400 + Math.random() * 500, () => {
      this.emit(failed ? { type: 'error', id: event.id } : { type: 'ack', id: event.id });

      if (failed || !event.replyFrom) return;

      const { conversationId, replyFrom } = event;
      this.later(1000, () => this.emit({ type: 'typing', conversationId, typing: true }));
      this.later(2800, () => {
        this.emit({ type: 'typing', conversationId, typing: false });
        this.emit({
          type: 'message',
          conversationId,
          senderId: replyFrom,
          content: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        });
      });
    });
  }

  close() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }

  private emit(event: ServerEvent) {
    if (this.readyState === FakeSocket.OPEN) this.onmessage?.({ data: JSON.stringify(event) });
  }

  private later(ms: number, fn: () => void) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    this.timers.add(timer);
  }
}
