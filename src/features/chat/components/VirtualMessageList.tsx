import { useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Lock } from 'lucide-react';

import type { Message } from '../types/chat';

import { buildRows } from '../utils/messageRows';
import { getVirtualRange } from '../../../shared/utils/virtualization';

import MessageBubble from './MessageBubble';

const ESTIMATED_ROW_HEIGHT = 64;
const LOAD_THRESHOLD = 200;
const BOTTOM_THRESHOLD = 80;

interface Props {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  loadOlder: () => void;
  onReply: (message: Message) => void;
  footer?: ReactNode;
}

export default function VirtualMessageList({ messages, hasMore, loading, loadOlder, onReply, footer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heights = useRef(new Map<string, number>());
  const [, remeasured] = useReducer((n: number) => n + 1, 0);

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const previous = useRef({ firstId: '', scrollHeight: 0 });

  const rows = useMemo(() => buildRows(messages), [messages]);
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const range = getVirtualRange(
    rows.map((row) => heights.current.get(row.id) ?? ESTIMATED_ROW_HEIGHT),
    scrollTop,
    viewportHeight,
    8
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setViewportHeight(container.clientHeight));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // older messages were added on top, keep the current view in place
    const firstId = rows[0]?.id ?? '';
    if (previous.current.firstId && firstId !== previous.current.firstId && !atBottomRef.current) {
      container.scrollTop += container.scrollHeight - previous.current.scrollHeight;
    }

    let changed = false;
    container.querySelectorAll<HTMLElement>('[data-row-id]').forEach((element) => {
      const id = element.dataset.rowId!;
      const height = element.offsetHeight;
      const old = heights.current.get(id) ?? ESTIMATED_ROW_HEIGHT;
      if (height === old) return;

      // a row above us changed height
      if (element.offsetTop + old <= container.scrollTop) container.scrollTop += height - old;
      heights.current.set(id, height);
      changed = true;
    });

    if (atBottomRef.current) container.scrollTop = container.scrollHeight;

    previous.current = { firstId, scrollHeight: container.scrollHeight };
    if (changed) remeasured();
  });

  const handleScroll = () => {
    const container = containerRef.current!;
    const bottom = container.scrollHeight - container.scrollTop - container.clientHeight < BOTTOM_THRESHOLD;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    setScrollTop(container.scrollTop);
    if (container.scrollTop < LOAD_THRESHOLD && hasMore) loadOlder();
  };

  const scrollToBottom = () => {
    const container = containerRef.current!;
    atBottomRef.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="message-scroller"
        className="relative h-full overflow-y-auto px-4 py-2 sm:px-[7%] lg:px-[9%]"
      >
        {loading && <p className="py-2 text-center text-xs text-ink-muted">Loading older messages…</p>}
        {!hasMore && messages.length > 0 && (
          <p className="mx-auto my-3 flex max-w-md items-start gap-1.5 rounded-lg bg-notice px-3 py-1.5 text-center text-xs leading-snug text-notice-ink shadow-sm">
            <Lock size={12} className="mt-0.5 shrink-0" />
            Messages are saved only in this browser.
          </p>
        )}

        <div style={{ height: range.paddingTop }} />
        {rows.slice(range.startIndex, range.endIndex).map((row) => (
          <div key={row.id} data-row-id={row.id}>
            {row.kind === 'date' ? (
              <div className="flex justify-center py-2">
                <span className="rounded-lg bg-bubble-in px-3 py-1.5 text-xs text-ink-muted shadow-sm">
                  {row.label}
                </span>
              </div>
            ) : (
              <MessageBubble
                message={row.message}
                replyMessage={row.message.replyToId ? messageById.get(row.message.replyToId) : undefined}
                first={row.first}
                onReply={onReply}
              />
            )}
          </div>
        ))}
        <div style={{ height: range.paddingBottom }} />

        {footer}
      </div>

      {!atBottom && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to latest message"
          className="absolute right-5 bottom-4 flex h-10 w-10 items-center justify-center rounded-full bg-bubble-in text-ink-muted shadow-md transition-colors hover:text-ink"
        >
          <ChevronDown size={22} />
        </button>
      )}
    </div>
  );
}
