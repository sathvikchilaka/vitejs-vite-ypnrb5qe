import { memo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  CornerUpLeft,
  FileText,
  Pencil,
  RotateCw,
  Smile,
  Trash2,
  X,
} from 'lucide-react';

import type { Message } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { retryMessage } from '../services/chatClient';
import { useChatStore } from '../store/useChatStore';
import { formatTime } from '../utils/messageRows';

interface Props {
  message: Message;
  replyMessage?: Message;
  /** First of a run from the same sender: shows tail + name, adds top gap. */
  first?: boolean;
  onReply: (message: Message) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const menuItem = 'flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-hover transition-colors';

function StatusIcon({ message }: { message: Message }) {
  switch (message.status) {
    case 'queued':
    case 'sending':
      return <Clock size={13} aria-label={message.status} />;
    case 'sent':
      return <Check size={15} aria-label="sent" />;
    case 'delivered':
      return <CheckCheck size={15} aria-label="delivered" />;
    case 'read':
      return <CheckCheck size={15} className="text-tick-read" aria-label="read" />;
    case 'failed':
      return <AlertCircle size={14} className="text-red-500" aria-label="failed" />;
  }
}

// Invisible inline space at the end of the text so the absolutely positioned time/ticks never overlap it (WhatsApp trick).
const MetaSpacer = ({ width = 64 }: { width?: number }) => (
  <span aria-hidden className="inline-block" style={{ width }} />
);

function MessageBubble({ message, replyMessage, first = true, onReply }: Props) {
  const isOwn = message.senderId === CURRENT_USER_ID;
  const sender = users.find((user) => user.id === message.senderId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const editMessage = useChatStore((state) => state.editMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const toggleReaction = useChatStore((state) => state.toggleReaction);

  const closeMenus = () => {
    setMenuOpen(false);
    setEmojiOpen(false);
  };

  const saveEdit = () => {
    if (editText.trim()) editMessage(message.id, editText.trim());
    setEditing(false);
  };

  const copy = async () => {
    closeMenus();
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      /* clipboard unavailable (e.g. insecure context) */
    }
  };

  return (
    <div
      className={`group flex px-2 ${first ? 'pt-2.5' : 'pt-0.5'} ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseLeave={closeMenus}
    >
      <div className="relative max-w-[85%] sm:max-w-[65%]">
        <div
          className={`relative rounded-[7.5px] px-2 pt-1.5 pb-1.5 text-ink shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] ${
            isOwn ? 'bg-bubble-out' : 'bg-bubble-in'
          } ${first ? (isOwn ? 'tail-out rounded-tr-none' : 'tail-in rounded-tl-none') : ''}`}
        >
          {!message.deleted && (
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Message options"
              className={`absolute top-0.5 right-0.5 z-10 rounded-full p-0.5 text-ink-muted opacity-0 ${isOwn ? 'bg-bubble-out' : 'bg-bubble-in'} transition-opacity group-hover:opacity-100 focus-visible:opacity-100`}
            >
              <ChevronDown size={18} />
            </button>
          )}

          {!isOwn && first && sender && (
            <p className="mb-0.5 text-[13px] font-medium" style={{ color: sender.color }}>
              {sender.name}
            </p>
          )}

          {replyMessage && !message.deleted && (
            <div className="mb-1 rounded-md border-l-4 border-brand bg-black/5 px-2 py-1 text-xs dark:bg-white/5">
              <p className="font-semibold text-brand">
                {replyMessage.senderId === CURRENT_USER_ID
                  ? 'You'
                  : users.find((u) => u.id === replyMessage.senderId)?.name}
              </p>
              <p className="line-clamp-2 text-ink-muted">
                {replyMessage.deleted ? 'Message deleted' : replyMessage.content || '📎 Attachment'}
              </p>
            </div>
          )}

          {message.deleted ? (
            <p className="text-sm text-ink-muted italic">
              🚫 This message was deleted
              <MetaSpacer />
            </p>
          ) : editing ? (
            <div className="min-w-[220px]">
              <textarea
                autoFocus
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    saveEdit();
                  }
                  if (event.key === 'Escape') setEditing(false);
                }}
                aria-label="Edit message"
                className="w-full resize-none rounded bg-panel p-2 text-sm outline-none"
              />
              <div className="flex justify-end gap-1">
                <button onClick={() => setEditing(false)} aria-label="Cancel edit" className="rounded p-1 hover:bg-black/10">
                  <X size={16} />
                </button>
                <button onClick={saveEdit} aria-label="Save edit" className="rounded p-1 hover:bg-black/10">
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.attachments?.map((file) =>
                file.type.startsWith('image/') ? (
                  <img
                    key={file.id}
                    src={file.url}
                    alt={file.name}
                    className="mb-1 h-56 w-72 max-w-full rounded-md object-cover"
                  />
                ) : (
                  <a
                    key={file.id}
                    href={file.url}
                    download={file.name}
                    className="mb-1 flex items-center gap-2 rounded-md bg-black/5 p-2 text-sm dark:bg-white/5"
                  >
                    <FileText size={28} className="shrink-0 text-ink-muted" />
                    <span className="min-w-0">
                      <span className="block truncate">{file.name}</span>
                      <span className="text-xs text-ink-muted">{(file.size / 1024).toFixed(1)} KB</span>
                    </span>
                  </a>
                )
              )}
              {message.content ? (
                <p className="text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">
                  {message.content}
                  <MetaSpacer width={(isOwn ? 88 : 64) + (message.updatedAt ? 40 : 0)} />
                </p>
              ) : (
                <div className="h-4" />
              )}
            </>
          )}

          <div className="absolute right-2 bottom-1 flex items-center gap-1 text-[11px] text-ink-muted">
            {message.updatedAt && !message.deleted && <span>edited</span>}
            <span>{formatTime(message.createdAt)}</span>
            {isOwn && !message.deleted && <StatusIcon message={message} />}
          </div>
        </div>

        {message.status === 'failed' && (
          <button
            onClick={() => retryMessage(message)}
            className="mt-0.5 ml-auto flex items-center gap-1 text-xs text-red-500 hover:underline"
          >
            <RotateCw size={12} /> Not sent · Retry
          </button>
        )}
        {message.status === 'queued' && (
          <p className="mt-0.5 text-right text-[11px] text-ink-muted">Waiting for connection…</p>
        )}

        {message.reactions.length > 0 && (
          <div className={`-mt-1 flex gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => toggleReaction(message.id, reaction.emoji)}
                aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length}`}
                className={`rounded-full border bg-bubble-in px-1.5 py-0.5 text-xs shadow-sm ${
                  reaction.userIds.includes(CURRENT_USER_ID) ? 'border-brand' : 'border-line'
                }`}
              >
                {reaction.emoji} {reaction.userIds.length > 1 && reaction.userIds.length}
              </button>
            ))}
          </div>
        )}

        {!message.deleted && (
          <button
            onClick={() => setEmojiOpen((open) => !open)}
            aria-label="React to message"
            className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-bubble-in p-1 text-ink-muted opacity-0 shadow transition-opacity group-hover:opacity-100 ${
              isOwn ? '-left-9' : '-right-9'
            }`}
          >
            <Smile size={18} />
          </button>
        )}

        {emojiOpen && (
          <div
            className={`absolute bottom-full z-20 mb-1 flex gap-1 rounded-full bg-bubble-in px-2 py-1 shadow-lg ${
              isOwn ? 'right-0' : 'left-0'
            }`}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction(message.id, emoji);
                  closeMenus();
                }}
                aria-label={`React ${emoji}`}
                className="text-xl transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {menuOpen && (
          <div
            role="menu"
            className={`absolute top-7 z-20 w-44 overflow-hidden rounded-lg bg-bubble-in py-2 shadow-lg ${
              isOwn ? 'right-0' : 'left-0'
            }`}
          >
            <button role="menuitem" className={menuItem} onClick={() => { onReply(message); closeMenus(); }}>
              <CornerUpLeft size={16} /> Reply
            </button>
            <button role="menuitem" className={menuItem} onClick={copy}>
              <Copy size={16} /> Copy
            </button>
            {isOwn && (
              <>
                <button
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setEditText(message.content);
                    setEditing(true);
                    closeMenus();
                  }}
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  role="menuitem"
                  className={`${menuItem} text-red-500`}
                  onClick={() => {
                    deleteMessage(message.id);
                    closeMenus();
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubble);
