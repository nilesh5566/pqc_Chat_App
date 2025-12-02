'use client';

export default function UserList({ users, selectedUser, onlineUsers, onSelectUser }) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-xl font-bold">Friends</h2>
        <p className="text-sm opacity-90">{users.length} friends</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No friends yet</p>
          </div>
        ) : (
          users.map((user) => {
            const isOnline = onlineUsers.has(user._id);
            const isSelected = selectedUser?._id === user._id;
            
            return (
              <div
                key={user._id}
                onClick={() => onSelectUser(user)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isOnline ? (
                        <span className="text-green-600 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        'Offline'
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}