import { useEffect } from 'react';

import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';

import { useChatStore } from './store/useChatStore';

export default function App() {
  const theme = useChatStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');

    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  return (
    <div className="h-dvh overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <ChatSidebar />
        <ChatWindow />
      </div>
    </div>
  );
}
