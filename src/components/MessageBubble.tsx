import { useState } from 'react';

import {
  Check,
  CheckCheck,
  Copy,
  CornerUpLeft,
  MoreHorizontal,
  Pencil,
  Smile,
  Trash2,
  X,
} from 'lucide-react';

import type { Message } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useChatStore } from '../store/useChatStore';

interface Props {
  message: Message;
  replyMessage?: Message;
  onReply: (message: Message) => void;
}

const emojis = ['❤️', '😂', '👍', '🔥', '🎉', '😮'];

export default function MessageBubble({
  message,
  replyMessage,
  onReply,
}: Props) {
  const isOwn = message.senderId === CURRENT_USER_ID;

  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const editMessage = useChatStore((state) => state.editMessage);

  const deleteMessage = useChatStore((state) => state.deleteMessage);

  const toggleReaction = useChatStore((state) => state.toggleReaction);

  const sender = users.find((user) => user.id === message.senderId);

  const handleEdit = () => {
    if (!editText.trim()) return;

    editMessage(message.id, editText.trim());
    setEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setMenuOpen(false);
    } catch {
      // Clipboard access can be unavailable in embedded previews.
    }
  };

  return (
    <div
      className={`
        group mb-4 flex w-full
        ${isOwn ? 'justify-end' : 'justify-start'}
      `}
    >
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {!isOwn && (
          <p className="mb-1 ml-2 text-xs font-medium text-indigo-500">
            {sender?.name}
          </p>
        )}

        <div
          className={`
            relative rounded-2xl px-4 py-3 shadow-sm
            ${
              isOwn
                ? 'rounded-br-md bg-indigo-600 text-white'
                : 'rounded-bl-md bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
            }
          `}
        >
          {message.deleted ? (
            <p className="text-sm italic opacity-70">
              This message was deleted
            </p>
          ) : editing ? (
            <div className="min-w-[200px]">
              <textarea
                autoFocus
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                className="
                  w-full resize-none rounded-lg
                  bg-white p-2 text-sm text-slate-900
                  outline-none
                "
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded p-1 hover:bg-white/20"
                  aria-label="Cancel edit"
                >
                  <X size={16} />
                </button>

                <button
                  onClick={handleEdit}
                  className="rounded p-1 hover:bg-white/20"
                  aria-label="Save edit"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {replyMessage && (
                <div
                  className={`
                    mb-2 rounded-lg border-l-4 p-2 text-xs
                    ${
                      isOwn
                        ? 'border-white/70 bg-white/10'
                        : 'border-indigo-500 bg-slate-100 dark:bg-slate-700'
                    }
                  `}
                >
                  <p className="mb-1 font-semibold">
                    {
                      users.find((user) => user.id === replyMessage.senderId)
                        ?.name
                    }
                  </p>

                  <p className="line-clamp-2 opacity-80">
                    {replyMessage.deleted
                      ? 'Message deleted'
                      : replyMessage.content}
                  </p>
                </div>
              )}

              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.content}
              </p>
            </>
          )}

          <div
            className={`
              mt-2 flex items-center justify-end gap-1
              text-[10px]
              ${isOwn ? 'text-indigo-100' : 'text-slate-400'}
            `}
          >
            {message.updatedAt && !message.deleted && <span>edited</span>}

            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {isOwn &&
              (message.status === 'read' ? (
                <CheckCheck size={14} className="text-sky-300" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={14} />
              ) : message.status === 'sent' ? (
                <Check size={14} />
              ) : (
                <span>◷</span>
              ))}
          </div>
        </div>

        {!message.deleted && (
          <>
            <div
              className={`
                mt-1 flex flex-wrap gap-1
                ${isOwn ? 'justify-end' : 'justify-start'}
              `}
            >
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => toggleReaction(message.id, reaction.emoji)}
                  className="
                    rounded-full border border-slate-200
                    bg-white px-2 py-0.5 text-xs
                    hover:border-indigo-400
                    dark:border-slate-700 dark:bg-slate-800
                  "
                >
                  {reaction.emoji} {reaction.userIds.length}
                </button>
              ))}
            </div>

            <div
              className={`
                mt-1 flex gap-1 opacity-100
                sm:opacity-0 sm:group-hover:opacity-100
                ${isOwn ? 'justify-end' : 'justify-start'}
              `}
            >
              <button
                onClick={() => onReply(message)}
                aria-label="Reply to message"
                className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <CornerUpLeft size={15} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setEmojiOpen(!emojiOpen)}
                  aria-label="React to message"
                  className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Smile size={15} />
                </button>

                {emojiOpen && (
                  <div
                    className="
                      absolute bottom-9 left-0 z-20
                      flex gap-1 rounded-xl border
                      border-slate-200 bg-white p-2 shadow-xl
                      dark:border-slate-700 dark:bg-slate-800
                    "
                  >
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          toggleReaction(message.id, emoji);
                          setEmojiOpen(false);
                        }}
                        className="text-lg hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Message options"
                  className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <MoreHorizontal size={15} />
                </button>

                {menuOpen && (
                  <div
                    className={`
                      absolute bottom-9 z-20 w-40
                      rounded-xl border border-slate-200
                      bg-white p-1 shadow-xl
                      dark:border-slate-700 dark:bg-slate-800
                      ${isOwn ? 'right-0' : 'left-0'}
                    `}
                  >
                    <button
                      onClick={handleCopy}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Copy size={14} /> Copy
                    </button>

                    {isOwn && (
                      <>
                        <button
                          onClick={() => {
                            setEditing(true);
                            setEditText(message.content);
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            deleteMessage(message.id);
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
