'use client';

export default function OnlineStatus({ online, lastSeen, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div className="flex items-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-white ${
          online ? 'bg-green-500' : 'bg-gray-400'
        } ${online ? 'animate-pulse' : ''}`}
        title={online ? 'Online' : `Last seen: ${formatLastSeen(lastSeen)}`}
      />
      <span className={`ml-2 text-sm ${online ? 'text-green-600' : 'text-gray-500'}`}>
        {online ? 'Online' : formatLastSeen(lastSeen)}
      </span>
    </div>
  );
}