import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { MAX_ROOMS_PER_USER } from '../constants';

const Lobby: React.FC = () => {
  const { rooms, joinRoom, createRoom, currentUser, users, addFriend, startDirectMessage, viewUserProfile } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [activeTab, setActiveTab] = useState<'rooms' | 'dm'>('rooms');
  const [friendIdInput, setFriendIdInput] = useState('');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    const success = await createRoom(newRoomName);
    if (success) {
      setNewRoomName('');
      setShowCreateModal(false);
    }
  };
  
  const getStatusBadge = (status?: string) => {
      const s = status || 'Online';
      let colorClass = 'bg-gray-100 text-gray-500';
      
      switch(s) {
          case 'Online': colorClass = 'bg-green-100 text-green-700 border-green-200'; break;
          case 'Away': colorClass = 'bg-amber-100 text-amber-700 border-amber-200'; break;
          case 'Busy': colorClass = 'bg-red-100 text-red-700 border-red-200'; break;
          case 'Offline': colorClass = 'bg-gray-100 text-gray-500 border-gray-200'; break;
      }
      
      return (
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${colorClass}`}>
              {s}
          </span>
      );
  };

  const myRoomCount = rooms.filter(r => r.adminId === currentUser?.id).length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-gray-50">
      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${activeTab === 'rooms' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Chatrooms
        </button>
        <button 
          onClick={() => setActiveTab('dm')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${activeTab === 'dm' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          DM
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'rooms' ? (
          <>
            {rooms.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No active rooms.</p>
                <p className="text-sm">Be the first to create one!</p>
              </div>
            ) : (
              rooms.map(room => (
                <div key={room.id} onClick={() => joinRoom(room.id)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-800">{room.name}</h3>
                    <p className="text-xs text-gray-500">Admin ID: {room.adminId}</p>
                  </div>
                  <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                     Active
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Start DM / Add Friend</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={friendIdInput}
                  onChange={(e) => setFriendIdInput(e.target.value)}
                  placeholder="Enter User ID"
                  className="flex-1 border rounded px-3 py-1 text-sm outline-none focus:border-indigo-500"
                />
                <Button variant="primary" onClick={() => { addFriend(friendIdInput); setFriendIdInput(''); }} className="!py-1 !px-3 !text-xs">Add</Button>
              </div>
            </div>

            {currentUser?.friends.length === 0 ? (
               <p className="text-center text-gray-400 text-sm mt-8">No contacts found.</p>
            ) : (
              currentUser?.friends.map(friendId => {
                const friend = users.find(u => u.id === friendId);
                return (
                  <div 
                    key={friendId} 
                    className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-3 border border-gray-100"
                  >
                     <div 
                        onClick={() => viewUserProfile(friendId)}
                        className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                        title="View Profile"
                     >
                        {friend?.photos && friend.photos.length > 0 ? (
                            <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                            friend?.username.charAt(0).toUpperCase()
                        )}
                     </div>
                     <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => startDirectMessage(friendId)}
                     >
                       <div className="flex items-center gap-2">
                           <p className="font-bold text-sm text-gray-800">{friend?.username || 'Unknown'}</p>
                           {getStatusBadge(friend?.status)}
                       </div>
                       <p className="text-[10px] text-gray-400">ID: {friendId}</p>
                     </div>
                     <button 
                        onClick={() => startDirectMessage(friendId)}
                        className="text-xs text-indigo-600 font-bold px-2 py-1 rounded hover:bg-indigo-50"
                     >
                        MSG
                     </button>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* FAB for Creating Room */}
      {activeTab === 'rooms' && (
        <div className="absolute bottom-6 right-6">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Chatroom</h2>
            <p className="text-sm text-gray-500 mb-4">
              You currently have {myRoomCount}/{MAX_ROOMS_PER_USER} rooms.
            </p>
            <form onSubmit={handleCreateRoom}>
              <input 
                type="text" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room Name"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-200 outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={myRoomCount >= MAX_ROOMS_PER_USER} className="flex-1">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;