'use client';

export default function TypingIndicator({ username }) {
  if (!username) return null;

  return (
    <div className="flex items-center space-x-2 p-2 text-sm text-gray-600">
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        />
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        />
      </div>
      <span className="italic">{username} is typing...</span>
    </div>
  );
}