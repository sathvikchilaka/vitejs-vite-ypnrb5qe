import { useMemo, useRef, useState } from 'react';
import { CheckCheck, EllipsisVertical, Moon, Search, SquarePen, Sun, Users, Wifi, WifiOff, X } from 'lucide-react';

import type { Message } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { setNetwork } from '../services/chatClient';
import { useChatStore } from '../store/useChatStore';
import { formatTime, getDateLabel } from '../utils/messageRows';

import Avatar from './Avatar';

const FILTERS = ['all', 'unread', 'groups'] as const;

const formatListTime = (timestamp: number) => {
  const label = getDateLabel(timestamp);
  return label === 'Today' ? formatTime(timestamp) : label;
};

export default function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);
  const selectedId = useChatStore((state) => state.selectedConversationId);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const filter = useChatStore((state) => state.filter);
  const setFilter = useChatStore((state) => state.setFilter);

  const theme = useChatStore((state) => state.theme);
  const toggleTheme = useChatStore((state) => state.toggleTheme);
  const online = useChatStore((state) => state.online);

  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search.trim().toLowerCase());

  // One pass over messages: last message per conversation + which ones match the search.
  const { lastMessage, contentMatches } = useMemo(() => {
    const last = new Map<string, Message>();
    const matches = new Set<string>();
    for (const m of messages) {
      const current = last.get(m.conversationId);
      if (!current || m.createdAt > current.createdAt) last.set(m.conversationId, m);
      if (debouncedSearch && m.content.toLowerCase().includes(debouncedSearch)) matches.add(m.conversationId);
    }
    return { lastMessage: last, contentMatches: matches };
  }, [messages, debouncedSearch]);

  const visible = useMemo(
    () =>
      conversations
        .filter(
          (c) =>
            !debouncedSearch ||
            c.name.toLowerCase().includes(debouncedSearch) ||
            contentMatches.has(c.id)
        )
        .filter(
          (c) =>
            filter === 'all' ||
            (filter === 'unread' && c.unreadCount > 0) ||
            (filter === 'groups' && c.type === 'group')
        )
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    [conversations, filter, debouncedSearch, contentMatches]
  );

  return (
    <aside
      className={`h-full w-full flex-col border-r border-line bg-panel md:flex md:w-[360px] md:shrink-0 lg:w-[420px] ${
        selectedId ? 'hidden' : 'flex'
      }`}
    >
      <header className="flex h-16 shrink-0 items-center gap-2 px-5">
        <div className="md:hidden">
          <Avatar user={users.find((u) => u.id === CURRENT_USER_ID)} size="sm" />
        </div>
        <h1 className="mr-auto text-[22px] font-bold">Chats</h1>
        <button
          onClick={() => searchRef.current?.focus()}
          aria-label="New chat"
          title="New chat"
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-hover"
        >
          <SquarePen size={20} />
        </button>
        <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenuOpen(false)}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className={`rounded-full p-2 text-ink-muted transition-colors hover:bg-hover ${menuOpen ? 'bg-hover' : ''}`}
          >
            <EllipsisVertical size={20} />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute top-11 right-0 z-30 w-52 overflow-hidden rounded-lg bg-bubble-in py-2 shadow-lg">
              <button
                role="menuitem"
                onClick={() => {
                  setNetwork(!online);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-hover"
              >
                {online ? <WifiOff size={17} /> : <Wifi size={17} />} {online ? 'Simulate offline' : 'Go online'}
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-hover"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />} {theme === 'dark' ? 'Light theme' : 'Dark theme'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search or start a new chat"
            aria-label="Search conversations"
            className="h-10 w-full rounded-full bg-input pr-9 pl-12 text-[15px] outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand/60"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-full border px-3 py-1 text-[15px] capitalize transition-colors ${
                filter === item
                  ? 'border-transparent bg-brand-soft text-brand-ink'
                  : 'border-line text-ink-muted hover:bg-hover'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Conversations">
        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-muted">No chats found.</p>
        ) : (
          visible.map((conversation) => {
            const last = lastMessage.get(conversation.id);
            const other = users.find((u) => u.id === conversation.memberIds.find((id) => id !== CURRENT_USER_ID));
            const unread = conversation.unreadCount > 0;

            return (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={`flex h-[72px] w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-hover ${
                  selectedId === conversation.id ? 'bg-selected' : ''
                }`}
              >
                {conversation.type === 'group' ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-selected text-ink-muted">
                    <Users size={21} />
                  </div>
                ) : (
                  <Avatar user={other} size="lg" showStatus />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[17px] ${unread ? 'font-semibold' : ''}`}>{conversation.name}</span>
                    <span className={`shrink-0 text-xs ${unread ? 'text-brand' : 'text-ink-muted'}`}>
                      {formatListTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1 truncate text-sm text-ink-muted">
                      {last?.senderId === CURRENT_USER_ID && !last.deleted && (
                        <CheckCheck size={15} className={`shrink-0 ${last.status === 'read' ? 'text-tick-read' : ''}`} />
                      )}
                      <span className="truncate">
                        {last?.deleted
                          ? 'This message was deleted'
                          : last?.content || (last?.attachments?.length ? '📎 Attachment' : 'No messages yet')}
                      </span>
                    </p>
                    {unread && (
                      <span
                        aria-label={`${conversation.unreadCount} unread`}
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white"
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </nav>
    </aside>
  );
}
