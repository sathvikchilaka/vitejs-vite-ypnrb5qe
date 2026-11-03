import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message } from '../types/chat';

import { getMessagesPage } from '../services/messageRepository';

const PAGE_SIZE = 30;

export function useInfiniteMessages(
  conversationId: string,
  allMessages: Message[]
) {
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadingRef = useRef(false);
  const requestVersion = useRef(0);
  const allMessagesRef = useRef(allMessages);

  allMessagesRef.current = allMessages;

  useEffect(() => {
    const version = ++requestVersion.current;

    loadingRef.current = true;

    setLoadedIds([]);
    setCursor(null);
    setHasMore(false);
    setLoading(true);

    getMessagesPage(conversationId, allMessagesRef.current, null, PAGE_SIZE)
      .then((page) => {
        if (version !== requestVersion.current) return;

        setLoadedIds(page.messages.map((message) => message.id));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch(console.error)
      .finally(() => {
        if (version !== requestVersion.current) return;

        loadingRef.current = false;
        setLoading(false);
      });

    return () => {
      requestVersion.current++;
    };
  }, [conversationId]);

  const loadOlder = useCallback(async () => {
    if (loadingRef.current || !hasMore || !cursor) return;

    loadingRef.current = true;
    setLoading(true);

    const version = requestVersion.current;

    try {
      const page = await getMessagesPage(
        conversationId,
        allMessagesRef.current,
        cursor,
        PAGE_SIZE
      );

      if (version !== requestVersion.current) return;

      setLoadedIds((current) => {
        const existing = new Set(current);

        return [
          ...page.messages
            .map((message) => message.id)
            .filter((id) => !existing.has(id)),
          ...current,
        ];
      });

      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } finally {
      if (version === requestVersion.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [conversationId, cursor, hasMore]);

  const conversationMessages = allMessages.filter(
    (message) => message.conversationId === conversationId
  );

  const messageById = new Map(
    conversationMessages.map((message) => [message.id, message])
  );

  const loadedSet = new Set(loadedIds);

  const newestLoaded = loadedIds.length
    ? messageById.get(loadedIds[loadedIds.length - 1])
    : undefined;

  const newMessages = newestLoaded
    ? conversationMessages.filter(
        (message) =>
          !loadedSet.has(message.id) &&
          (message.createdAt > newestLoaded.createdAt ||
            (message.createdAt === newestLoaded.createdAt &&
              message.id > newestLoaded.id))
      )
    : [];

  const loadedMessages = [
    ...loadedIds
      .map((id) => messageById.get(id))
      .filter((message): message is Message => Boolean(message)),
    ...newMessages,
  ].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  return {
    loadedMessages,
    hasMore,
    loading,
    loadOlder,
  };
}
