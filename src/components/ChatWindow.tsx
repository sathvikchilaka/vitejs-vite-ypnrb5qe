import { useEffect, useMemo, useRef, useState } from 'react';

import { ArrowLeft, Info, MessageCircle, Search, X } from 'lucide-react';

import type { Message } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useChatStore } from '../store/useChatStore';

import Avatar from './Avatar';
// import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import GroupInfo from './GroupInfo';
import { useInfiniteMessages } from '../hooks/useInfiniteMessages';
import VirtualMessageList from './VirtualMessageList';

export default function ChatWindow() {
  const selectedId = useChatStore((state) => state.selectedConversationId);

  const conversations = useChatStore((state) => state.conversations);

  const messages = useChatStore((state) => state.messages);

  const typingIds = useChatStore((state) => state.typingConversationIds);

  const selectConversation = useChatStore((state) => state.selectConversation);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [messageQuery, setMessageQuery] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousConversationRef = useRef<string | null>(null);

  const conversation = conversations.find((item) => item.id === selectedId);

  const { loadedMessages, hasMore, loading, loadOlder } = useInfiniteMessages(
    conversation.id,
    messages
  );

  const conversationMessages = useMemo(() => {
    return messages
      .filter((message) => message.conversationId === selectedId)
      .filter((message) =>
        message.content.toLowerCase().includes(messageQuery.toLowerCase())
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, selectedId, messageQuery]);

  const otherUser = users.find(
    (user) =>
      user.id === conversation?.memberIds.find((id) => id !== CURRENT_USER_ID)
  );

  const isTyping = selectedId !== null && typingIds.includes(selectedId);

  useEffect(() => {
    setReplyTo(null);
    setShowGroupInfo(false);
    setShowSearch(false);
    setMessageQuery('');
  }, [selectedId]);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) return;

    const conversationChanged = previousConversationRef.current !== selectedId;

    previousConversationRef.current = selectedId;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (conversationChanged || distanceFromBottom < 180) {
      bottomRef.current?.scrollIntoView({
        behavior: conversationChanged ? 'instant' : 'smooth',
      });
    }
  }, [conversationMessages.length, selectedId, isTyping]);

  if (!conversation) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center bg-slate-50 text-center dark:bg-slate-900 md:flex">
        <div className="mb-5 rounded-3xl bg-indigo-100 p-6 text-indigo-600 dark:bg-indigo-950">
          <MessageCircle size={44} />
        </div>

        <h2 className="text-2xl font-bold">Welcome to Pulse Chat</h2>

        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Select a conversation to start messaging.
        </p>
      </div>
    );
  }

  const getDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  let previousDate = '';

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-900">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => selectConversation(null)}
            aria-label="Back to conversations"
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            <ArrowLeft size={20} />
          </button>

          <Avatar
            user={conversation.type === 'direct' ? otherUser : undefined}
            name={conversation.name}
            showStatus={conversation.type === 'direct'}
          />

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold sm:text-base">
              {conversation.name}
            </h2>

            <p className="text-xs text-slate-500">
              {isTyping
                ? 'Typing...'
                : conversation.type === 'group'
                ? `${conversation.memberIds.length} members`
                : otherUser?.online
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search messages"
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Search size={20} />
          </button>

          {conversation.type === 'group' && (
            <button
              onClick={() => setShowGroupInfo(true)}
              aria-label="Group information"
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Info size={20} />
            </button>
          )}
        </div>
      </header>

      {showSearch && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
          <Search size={17} className="text-slate-400" />

          <input
            autoFocus
            value={messageQuery}
            onChange={(event) => setMessageQuery(event.target.value)}
            placeholder="Search messages..."
            aria-label="Search messages"
            className="flex-1 bg-transparent text-sm outline-none"
          />

          <button
            onClick={() => {
              setShowSearch(false);
              setMessageQuery('');
            }}
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8"
      >
        <div className="mx-auto max-w-4xl">
          {loadedMessages.length === 0 && (
            <div className="py-20 text-center text-sm text-slate-500">
              {messageQuery
                ? 'No matching messages found.'
                : 'No messages yet. Say hello! 👋'}
            </div>
          )}

          <div className="min-h-0 flex-1">
            <VirtualMessageList
              key={conversation.id}
              messages={loadedMessages}
              hasMore={hasMore}
              loading={loading}
              loadOlder={loadOlder}
            />
          </div>

          {isTyping && (
            <div className="mb-4 flex justify-start">
              <div className="rounded-2xl bg-white px-5 py-3 shadow-sm dark:bg-slate-800">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
                      style={{
                        animationDelay: `${index * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <MessageComposer
        conversationId={conversation.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {showGroupInfo && (
        <GroupInfo
          conversation={conversation}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </main>
  );
}
