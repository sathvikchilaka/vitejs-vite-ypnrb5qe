import { useEffect } from 'react';

import { ChatSidebar, ChatWindow, NavRail, startRealtime, useChatStore } from './features/chat';

export default function App() {
  const theme = useChatStore((state) => state.theme);
  const hydrated = useChatStore((state) => state.hydrated);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // wait for persisted state so old queued messages get sent
  useEffect(() => (hydrated ? startRealtime() : undefined), [hydrated]);

  return (
    <div className="flex h-dvh overflow-hidden bg-app text-ink">
      <NavRail />
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
