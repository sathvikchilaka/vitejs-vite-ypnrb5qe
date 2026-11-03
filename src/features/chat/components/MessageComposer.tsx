import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Mic, Plus, SendHorizontal, Smile, X } from 'lucide-react';

import type { Message } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useAttachments } from '../hooks/useAttachments';
import { sendChatMessage } from '../services/chatClient';

interface Props {
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

interface FormValues {
  message: string;
}

export default function MessageComposer({ conversationId, replyTo, onCancelReply }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = useAttachments();

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<FormValues>({ defaultValues: { message: '' } });
  const { ref: registerRef, ...messageField } = register('message');
  const canSend = Boolean(watch('message')?.trim()) || attachments.files.length > 0;

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId, replyTo]);

  const onSubmit = async ({ message }: FormValues) => {
    const content = message.trim();
    if (!content && !attachments.files.length) return;

    const files = attachments.files.length ? await attachments.toAttachments() : undefined;
    sendChatMessage(conversationId, content, replyTo?.id, files);

    reset();
    attachments.clear();
    onCancelReply();
  };

  const replyAuthor =
    replyTo?.senderId === CURRENT_USER_ID ? 'You' : users.find((u) => u.id === replyTo?.senderId)?.name;

  return (
    <div className="bg-chat px-4 pt-1 pb-3">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-brand bg-panel px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand">{replyAuthor}</p>
            <p className="truncate text-xs text-ink-muted">{replyTo.content || '📎 Attachment'}</p>
          </div>
          <button onClick={onCancelReply} aria-label="Cancel reply" className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
      )}

      {attachments.files.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto rounded-lg bg-panel p-2" aria-label="Attachment previews">
          {attachments.files.map(({ id, file, previewUrl }) => (
            <div key={id} className="relative shrink-0">
              {file.type.startsWith('image/') ? (
                <img src={previewUrl} alt={file.name} className="h-20 w-20 rounded object-cover" />
              ) : (
                <div className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded bg-hover p-1 text-center">
                  <FileText size={22} className="text-ink-muted" />
                  <span className="w-full truncate text-[10px]">{file.name}</span>
                </div>
              )}
              <button
                onClick={() => attachments.remove(id)}
                aria-label={`Remove ${file.name}`}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-ink p-0.5 text-panel"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachments.error && <p className="mb-1 text-xs text-red-500">{attachments.error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
        <div className="flex min-h-13 flex-1 items-end gap-1 rounded-[26px] bg-bubble-in px-2 py-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach files"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-hover"
          >
            <Plus size={24} />
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('message', `${getValues('message')}😊`, { shouldDirty: true });
              textareaRef.current?.focus();
            }}
            aria-label="Insert emoji"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-hover"
          >
            <Smile size={22} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept="image/*,application/pdf,text/plain"
            data-testid="file-input"
            onChange={(event) => {
              attachments.add(event.target.files);
              event.target.value = '';
            }}
          />

          <textarea
            {...messageField}
            ref={(element) => {
              registerRef(element);
              textareaRef.current = element;
            }}
            rows={1}
            placeholder="Type a message"
            aria-label="Type a message"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void handleSubmit(onSubmit)();
              }
              if (event.key === 'Escape' && replyTo) onCancelReply();
            }}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] outline-none focus-visible:outline-none placeholder:text-ink-muted"
          />
        </div>

        {canSend ? (
          <button
            type="submit"
            aria-label="Send message"
            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-colors hover:opacity-90"
          >
            <SendHorizontal size={22} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Voice message (not available)"
            title="Voice messages aren't supported in this demo"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-hover"
          >
            <Mic size={22} />
          </button>
        )}
      </form>
    </div>
  );
}
