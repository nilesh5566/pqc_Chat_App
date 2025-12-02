'use client';

import { useEffect, useRef } from 'react';

export default function ChatWindow({ messages, currentUserId, typingUser }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isMine = message.sender._id === currentUserId;
            const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;

            return (
              <div
                key={message._id || index}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {!isMine && showAvatar && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
                    {message.sender.username[0].toUpperCase()}
                  </div>
                )}
                {!isMine && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}
                
                <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : ''}`}>
                  {!isMine && showAvatar && (
                    <div className="text-xs text-gray-600 mb-1 ml-1">
                      {message.sender.username}
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-lg shadow ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                    } ${message.pending ? 'opacity-60' : ''}`}
                  >
                    <p className="break-words">{message.text}</p>
                    <div
                      className={`text-xs mt-1 ${
                        isMine ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                      {message.pending && ' • Sending...'}
                      {message.read && isMine && ' • Read'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {typingUser && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
                {typingUser.username[0].toUpperCase()}
              </div>
              <div className="bg-white text-gray-800 px-4 py-2 rounded-lg rounded-bl-none shadow">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}