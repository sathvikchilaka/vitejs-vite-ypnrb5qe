import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message } from '../types/chat';

export const PAGE_SIZE = 50;
const FAKE_LATENCY = 400;

export function useInfiniteMessages(messages: Message[]) {
  const [count, setCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const hasMore = count < messages.length;

  const loadOlder = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    timer.current = setTimeout(() => {
      setCount((c) => c + PAGE_SIZE);
      setLoading(false);
    }, FAKE_LATENCY);
  }, [loading, hasMore]);

  return {
    visibleMessages: hasMore ? messages.slice(-count) : messages,
    hasMore,
    loading,
    loadOlder,
  };
}
