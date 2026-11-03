import { useState } from 'react';
import { Plus, UserMinus, X } from 'lucide-react';

import type { Conversation } from '../types/chat';

import { CURRENT_USER_ID, users } from '../data/mockData';
import { useChatStore } from '../store/useChatStore';

import Avatar from './Avatar';

interface Props {
  conversation: Conversation;
  onClose: () => void;
}

export default function GroupInfo({ conversation, onClose }: Props) {
  const [showAddMembers, setShowAddMembers] = useState(false);

  const addMember = useChatStore((state) => state.addMember);

  const removeMember = useChatStore((state) => state.removeMember);

  const members = users.filter((user) =>
    conversation.memberIds.includes(user.id)
  );

  const availableUsers = users.filter(
    (user) => !conversation.memberIds.includes(user.id)
  );

  return (
    <aside className="absolute inset-0 z-30 overflow-y-auto border-l border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-80">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Group Info</h2>

        <button
          onClick={onClose}
          aria-label="Close group info"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl">
          👥
        </div>

        <h3 className="text-lg font-bold">{conversation.name}</h3>

        <p className="text-sm text-slate-500">{members.length} members</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold">Members</h4>

        <button
          onClick={() => setShowAddMembers(!showAddMembers)}
          aria-label="Add members"
          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
        >
          <Plus size={19} />
        </button>
      </div>

      {showAddMembers && (
        <div className="mb-5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="mb-3 text-xs font-semibold">Add members</p>

          {availableUsers.length === 0 ? (
            <p className="text-xs text-slate-500">
              Everyone is already in this group.
            </p>
          ) : (
            availableUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => addMember(conversation.id, user.id)}
                className="flex w-full items-center justify-between rounded-lg p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {user.name}
                <Plus size={15} />
              </button>
            ))
          )}
        </div>
      )}

      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar user={member} size="sm" showStatus />

            <div className="flex-1">
              <p className="text-sm font-medium">{member.name}</p>

              <p className="text-xs text-slate-500">
                {member.online ? 'Online' : 'Offline'}
              </p>
            </div>

            {member.id !== CURRENT_USER_ID && (
              <button
                onClick={() => removeMember(conversation.id, member.id)}
                aria-label={`Remove ${member.name}`}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800"
              >
                <UserMinus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
