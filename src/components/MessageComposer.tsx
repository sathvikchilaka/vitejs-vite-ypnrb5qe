import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Send, X } from 'lucide-react';

import type { Message } from '../types/chat';

import { useChatStore } from '../store/useChatStore';

import {
  simulateIncomingMessage,
  simulateMessageDelivery,
} from '../services/mockChatService';

interface Props {
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

interface FormValues {
  message: string;
}

export default function MessageComposer({
  conversationId,
  replyTo,
  onCancelReply,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const sendMessage = useChatStore((state) => state.sendMessage);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      message: '',
    },
  });

  const messageValue = watch('message');

  const { ref: formRef, ...messageField } = register('message');

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId, replyTo]);

  const onSubmit = ({ message }: FormValues) => {
    const content = message.trim();

    if (!content) return;

    const messageId = sendMessage(conversationId, content, replyTo?.id);

    reset();
    onCancelReply();

    simulateMessageDelivery(messageId);
    simulateIncomingMessage(conversationId);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {replyTo && (
        <div className="mb-3 flex items-center justify-between rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3 dark:bg-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-500">
              Replying to message
            </p>

            <p className="truncate text-xs text-slate-500">{replyTo.content}</p>
          </div>

          <button onClick={onCancelReply} aria-label="Cancel reply">
            <X size={17} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            {...messageField}
            ref={(element) => {
              formRef(element);
              textareaRef.current = element;
            }}
            rows={1}
            placeholder="Type a message..."
            aria-label="Type a message"
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void handleSubmit(onSubmit)();
              }
            }}
            className="
              max-h-32 min-h-11 w-full resize-none
              rounded-xl border border-slate-200
              bg-slate-50 px-4 py-3 text-sm
              outline-none transition
              focus:border-indigo-500 focus:ring-2
              focus:ring-indigo-500/20
              dark:border-slate-700 dark:bg-slate-800
            "
          />
        </div>

        <button
          type="submit"
          disabled={!messageValue?.trim()}
          aria-label="Send message"
          className="
            flex h-11 w-11 shrink-0 items-center
            justify-center rounded-xl bg-indigo-600
            text-white transition hover:bg-indigo-700
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          <Send size={19} />
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] text-slate-400">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
