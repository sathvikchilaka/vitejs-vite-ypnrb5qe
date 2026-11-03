import { useMemo, useState } from 'react';
import { MessageCircle, Moon, Search, Sun, Users } from 'lucide-react';

import { useChatStore } from '../store/useChatStore';
import { users } from '../data/mockData';
import { useDebounce } from '../hooks/useDebounce';

import Avatar from './Avatar';

export default function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);

  const messages = useChatStore((state) => state.messages);

  const selectedId = useChatStore((state) => state.selectedConversationId);

  const selectConversation = useChatStore((state) => state.selectConversation);

  const filter = useChatStore((state) => state.filter);
  const setFilter = useChatStore((state) => state.setFilter);

  const theme = useChatStore((state) => state.theme);
  const toggleTheme = useChatStore((state) => state.toggleTheme);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conversation) => {
        const matchesSearch = conversation.name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());

        const matchesFilter =
          filter === 'all' ||
          (filter === 'unread' && conversation.unreadCount > 0) ||
          (filter === 'groups' && conversation.type === 'group');

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [conversations, filter, debouncedSearch]);

  const getLastMessage = (conversationId: string) => {
    return messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  };

  return (
    <aside
      className={`
        flex h-full w-full flex-col
        border-r border-slate-200
        bg-white dark:border-slate-800 dark:bg-slate-950
        md:w-[360px] md:shrink-0
        ${selectedId ? 'hidden md:flex' : 'flex'}
      `}
    >
      <div className="border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <MessageCircle size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">Pulse Chat</h1>
              <p className="text-xs text-slate-500">Stay connected</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="
              w-full rounded-xl bg-slate-100
              py-2.5 pl-10 pr-4 text-sm
              outline-none focus:ring-2 focus:ring-indigo-500
              dark:bg-slate-800
            "
          />
        </div>

        <div className="mt-5 flex gap-2">
          {(['all', 'unread', 'groups'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`
                  rounded-lg px-4 py-2 text-sm font-medium
                  capitalize transition
                  ${
                    filter === item
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }
                `}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const lastMessage = getLastMessage(conversation.id);

            const otherUser = users.find(
              (user) =>
                user.id === conversation.memberIds.find((id) => id !== 'me')
            );

            const selected = selectedId === conversation.id;

            return (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={`
                  flex w-full items-center gap-3
                  border-b border-slate-50 px-5 py-4
                  text-left transition
                  hover:bg-slate-50 dark:border-slate-900
                  dark:hover:bg-slate-900
                  ${selected ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}
                `}
              >
                {conversation.type === 'group' ? (
                  <div
                    className="
                      flex h-11 w-11 shrink-0 items-center
                      justify-center rounded-full
                      bg-indigo-100 text-indigo-600
                      dark:bg-indigo-900/50
                    "
                  >
                    <Users size={21} />
                  </div>
                ) : (
                  <Avatar user={otherUser} showStatus />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {conversation.name}
                    </span>

                    <span className="shrink-0 text-[11px] text-slate-400">
                      {new Date(conversation.lastMessageAt).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">
                      {lastMessage?.deleted
                        ? 'Message deleted'
                        : lastMessage?.content || 'No messages yet'}
                    </p>

                    {conversation.unreadCount > 0 && (
                      <span
                        className="
                          flex h-5 min-w-5 items-center
                          justify-center rounded-full
                          bg-indigo-600 px-1
                          text-[10px] font-bold text-white
                        "
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
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar user={users[0]} size="sm" />

          <div>
            <p className="text-sm font-semibold">My Account</p>
            <p className="text-xs text-green-500">● Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
