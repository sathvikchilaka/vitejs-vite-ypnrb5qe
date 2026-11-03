import { MessageSquareText, Moon, Settings, Sun, Wifi, WifiOff } from 'lucide-react';

import { setNetwork } from '../services/chatClient';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useChatStore } from '../store/useChatStore';

import Avatar from './Avatar';

const railButton =
  'relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-selected';

export default function NavRail() {
  const theme = useChatStore((state) => state.theme);
  const toggleTheme = useChatStore((state) => state.toggleTheme);
  const online = useChatStore((state) => state.online);
  const unreadChats = useChatStore((state) => state.conversations.filter((c) => c.unreadCount > 0).length);

  return (
    <nav aria-label="App" className="hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-line bg-rail py-3 md:flex">
      <button aria-label="Chats" aria-current="page" className={`${railButton} bg-selected text-ink`}>
        <MessageSquareText size={22} />
        {unreadChats > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
            {unreadChats}
          </span>
        )}
      </button>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => setNetwork(!online)}
          aria-label={online ? 'Go offline' : 'Go online'}
          title={online ? 'Simulate offline' : 'Reconnect'}
          className={railButton}
        >
          {online ? <Wifi size={21} /> : <WifiOff size={21} className="text-red-500" />}
        </button>
        <button onClick={toggleTheme} aria-label="Toggle theme" className={railButton}>
          {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
        </button>
        <button aria-label="Settings" className={railButton}>
          <Settings size={22} />
        </button>
        <Avatar user={users.find((u) => u.id === CURRENT_USER_ID)} size="sm" />
      </div>
    </nav>
  );
}
