import { useMemo, useState } from 'react';
import { ArrowLeft, Database, Info, Lock, MessageCircle, Search, WifiOff, X } from 'lucide-react';

import type { Conversation, Message } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useInfiniteMessages } from '../hooks/useInfiniteMessages';
import { useChatStore } from '../store/useChatStore';

import Avatar from './Avatar';
import GroupInfo from './GroupInfo';
import MessageComposer from './MessageComposer';
import VirtualMessageList from './VirtualMessageList';

const iconButton = 'rounded-full p-2 text-ink-muted transition-colors hover:bg-hover';

export default function ChatWindow() {
  const selectedId = useChatStore((state) => state.selectedConversationId);
  const conversation = useChatStore((state) => state.conversations.find((c) => c.id === selectedId));

  if (!conversation) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center gap-4 border-b-[6px] border-brand bg-app px-8 text-center md:flex">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MessageCircle size={56} strokeWidth={1.5} />
        </div>
        <h2 className="text-[32px] font-light text-ink">Pulse Chat Web</h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">
          Send and receive messages in real time. Pick a chat on the left to get started.
        </p>
        <p className="mt-8 flex items-center gap-1.5 text-xs text-ink-muted">
          <Lock size={12} /> Your messages are stored locally in this browser
        </p>
      </div>
    );
  }

  return <ConversationView key={conversation.id} conversation={conversation} />;
}

function ConversationView({ conversation }: { conversation: Conversation }) {
  const allMessages = useChatStore((state) => state.messages);
  const isTyping = useChatStore((state) => state.typingConversationIds.includes(conversation.id));
  const online = useChatStore((state) => state.online);
  const hydrated = useChatStore((state) => state.hydrated);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const seedMessages = useChatStore((state) => state.seedMessages);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim().toLowerCase());

  const messages = useMemo(
    () =>
      allMessages
        .filter((m) => m.conversationId === conversation.id)
        .filter((m) => !debouncedQuery || m.content.toLowerCase().includes(debouncedQuery))
        .sort((a, b) => a.createdAt - b.createdAt),
    [allMessages, conversation.id, debouncedQuery]
  );

  const { visibleMessages, hasMore, loading, loadOlder } = useInfiniteMessages(messages);

  const otherUser = users.find(
    (user) => user.id === conversation.memberIds.find((id) => id !== CURRENT_USER_ID)
  );

  const subtitle = isTyping
    ? 'typing…'
    : conversation.type === 'group'
      ? users.filter((u) => conversation.memberIds.includes(u.id)).map((u) => (u.id === CURRENT_USER_ID ? 'You' : u.name)).join(', ')
      : otherUser?.online
        ? 'online'
        : 'offline';

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line bg-panel-header px-4">
        <button
          onClick={() => selectConversation(null)}
          aria-label="Back to conversations"
          className="-ml-2 rounded-full p-2 text-ink-muted hover:bg-hover md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => conversation.type === 'group' && setShowGroupInfo(true)}
        >
          <Avatar
            user={conversation.type === 'direct' ? otherUser : undefined}
            name={conversation.name}
            showStatus={conversation.type === 'direct'}
          />
          <span className="min-w-0">
            <span className="block truncate text-base font-medium">{conversation.name}</span>
            <span className={`block truncate text-xs ${isTyping ? 'text-brand' : 'text-ink-muted'}`}>{subtitle}</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <button
            onClick={() => seedMessages(conversation.id, 10_000)}
            aria-label="Add 10,000 messages"
            title="Load test: add 10,000 messages"
            className={iconButton}
          >
            <Database size={19} />
          </button>
          <button onClick={() => setShowSearch((s) => !s)} aria-label="Search messages" className={iconButton}>
            <Search size={19} />
          </button>
          {conversation.type === 'group' && (
            <button onClick={() => setShowGroupInfo(true)} aria-label="Group information" className={iconButton}>
              <Info size={19} />
            </button>
          )}
        </div>
      </header>

      {!online && (
        <div className="flex items-center justify-center gap-2 bg-notice px-4 py-2 text-center text-xs text-notice-ink">
          <WifiOff size={14} />
          You're offline. Messages will be sent when you reconnect.
        </div>
      )}

      {showSearch && (
        <div className="flex items-center gap-3 border-b border-line bg-panel px-4 py-2">
          <Search size={16} className="text-ink-muted" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && (setShowSearch(false), setQuery(''))}
            placeholder="Search messages…"
            aria-label="Search in conversation"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
          {debouncedQuery && <span className="text-xs text-ink-muted">{messages.length} found</span>}
          <button
            onClick={() => {
              setShowSearch(false);
              setQuery('');
            }}
            aria-label="Close search"
            className="text-ink-muted"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-wallpaper flex min-h-0 flex-1 flex-col">
        {!hydrated ? (
          <p className="m-auto text-sm text-ink-muted">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="m-auto rounded-lg bg-notice px-4 py-2 text-sm text-notice-ink shadow-sm">
            {debouncedQuery ? 'No matching messages.' : 'No messages yet. Say hello! 👋'}
          </p>
        ) : (
          <VirtualMessageList
            key={debouncedQuery}
            messages={visibleMessages}
            hasMore={hasMore}
            loading={loading}
            loadOlder={loadOlder}
            onReply={setReplyTo}
            footer={
              isTyping && (
                <div className="flex py-1" aria-label="Typing indicator">
                  <div className="tail-in relative ml-2 flex gap-1 rounded-lg rounded-tl-none bg-bubble-in px-4 py-3 shadow-sm">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="animate-typing h-2 w-2 rounded-full bg-ink-muted"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )
            }
          />
        )}
      </div>

      <MessageComposer conversationId={conversation.id} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />

      {showGroupInfo && <GroupInfo conversation={conversation} onClose={() => setShowGroupInfo(false)} />}
    </main>
  );
}
