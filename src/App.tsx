import { useEffect } from 'react';

import { ChatSidebar, ChatWindow, NavRail, startRealtime, useChatStore } from './features/chat';

export default function App() {
  const theme = useChatStore((state) => state.theme);
  const hydrated = useChatStore((state) => state.hydrated);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Connect only after persisted state loads, so the offline queue from a previous session flushes.
  useEffect(() => (hydrated ? startRealtime() : undefined), [hydrated]);

  return (
    <div className="flex h-dvh overflow-hidden bg-app text-ink">
      <NavRail />
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
