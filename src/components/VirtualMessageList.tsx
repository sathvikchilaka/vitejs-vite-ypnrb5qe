import { useCallback, useLayoutEffect, useRef } from 'react';

import type { Message } from '../types/chat';

import { useVirtualizer } from '../hooks/useVirtualizer';

import MessageBubble from './MessageBubble';

interface VirtualMessageListProps {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  loadOlder: () => Promise<void>;
}

export default function VirtualMessageList({
  messages,
  hasMore,
  loading,
  loadOlder,
}: VirtualMessageListProps) {
  const { containerRef, onScroll, measureElement, range, scrollToBottom } =
    useVirtualizer({
      itemIds: messages.map((message) => message.id),
      estimatedHeight: 88,
      overscan: 8,
    });

  const previousFirstId = useRef<string | undefined>(undefined);
  const previousLastId = useRef<string | undefined>(undefined);
  const previousScrollHeight = useRef(0);
  const wasNearBottom = useRef(true);
  const initialScrollDone = useRef(false);
  const loadingOlderRef = useRef(false);

  const firstId = messages[0]?.id;
  const lastId = messages[messages.length - 1]?.id;

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      onScroll(event);

      const container = event.currentTarget;

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      wasNearBottom.current = distanceFromBottom < 120;

      if (
        container.scrollTop < 150 &&
        hasMore &&
        !loading &&
        !loadingOlderRef.current
      ) {
        previousScrollHeight.current = container.scrollHeight;
        loadingOlderRef.current = true;

        void loadOlder().finally(() => {
          loadingOlderRef.current = false;
        });
      }
    },
    [onScroll, hasMore, loading, loadOlder]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || !messages.length) return;

    if (!initialScrollDone.current) {
      scrollToBottom();
      initialScrollDone.current = true;
    } else if (previousFirstId.current && firstId !== previousFirstId.current) {
      const difference = container.scrollHeight - previousScrollHeight.current;

      if (previousScrollHeight.current > 0) {
        container.scrollTop += difference;
      }
    } else if (previousLastId.current !== lastId && wasNearBottom.current) {
      scrollToBottom();
    }

    previousFirstId.current = firstId;
    previousLastId.current = lastId;
  }, [messages.length, firstId, lastId, containerRef, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
    >
      {loading && (
        <div className="py-3 text-center text-xs text-gray-400">
          Loading messages...
        </div>
      )}

      <div style={{ height: range.paddingTop }} />

      {messages.slice(range.startIndex, range.endIndex).map((message) => (
        <div
          key={message.id}
          ref={(element) => measureElement(message.id, element)}
        >
          <MessageBubble message={message} />
        </div>
      ))}

      <div style={{ height: range.paddingBottom }} />
    </div>
  );
}
