import type { User } from '../types/chat';

interface AvatarProps {
  user?: User;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-12 w-12 text-base',
};

export default function Avatar({
  user,
  name,
  size = 'md',
  showStatus = false,
}: AvatarProps) {
  const displayName = user?.name || name || 'Unknown';

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative shrink-0">
      <div
        className={`
          ${sizes[size]}
          flex items-center justify-center
          rounded-full font-semibold text-white
        `}
        style={{
          backgroundColor: user?.color || 'var(--brand)',
        }}
      >
        {initials}
      </div>

      {showStatus && user?.online && (
        <span
          className="
            absolute bottom-0 right-0
            h-3 w-3 rounded-full
            border-2 border-panel bg-brand
          "
        />
      )}
    </div>
  );
}
