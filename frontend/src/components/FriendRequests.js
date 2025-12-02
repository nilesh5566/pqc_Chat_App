'use client';

export default function FriendRequests({ requests, onAccept, onReject, loading }) {
  if (!requests || requests.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {requests.map((request) => (
        <div
          key={request._id}
          className="p-4 hover:bg-gray-50 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {request.from.username[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {request.from.username}
                </div>
                <div className="text-sm text-gray-500">
                  {request.from.email}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onAccept(request._id)}
                disabled={loading[request._id]}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
              >
                {loading[request._id] ? '...' : 'Accept'}
              </button>
              <button
                onClick={() => onReject(request._id)}
                disabled={loading[request._id]}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
              >
                {loading[request._id] ? '...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}