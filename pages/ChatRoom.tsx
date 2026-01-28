import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Message, MessageType } from '../types';
import EmojiPicker from '../components/EmojiPicker';
import Button from '../components/Button';

const ChatRoom: React.FC = () => {
  const { messages, activeRoomId, rooms, sendMessage, currentUser, kickUser, banUser, activeRoomUsers, viewUserProfile, updateRoomDetails } = useApp();
  const [input, setInput] = useState('');
  const [showModMenuId, setShowModMenuId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  const room = rooms.find(r => r.id === activeRoomId);
  const roomMessages = messages.filter(m => m.roomId === activeRoomId);
  const isAdmin = room?.adminId === currentUser?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  const handleSaveRoomDetails = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editName.trim()) return;
      await updateRoomDetails(editName, editTopic);
      setShowEditModal(false);
  };

  const getUsernameColor = (name: string, isMe: boolean) => {
    const len = name.length;
    if (len === 1) return 'text-red-600';
    if (len === 2) return 'text-yellow-600';
    if (len === 3) return 'text-purple-600';
    return isMe ? 'text-indigo-600' : 'text-gray-800';
  };

  if (!room) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-white relative">
      {/* Header Info */}
      <div className="bg-indigo-50 px-4 py-2 shadow-sm border-b border-indigo-100 flex justify-between items-center z-10 min-h-[56px]">
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-indigo-900 leading-tight truncate">{room.name}</h2>
             {isAdmin && (
                 <button 
                    onClick={() => {
                        setEditName(room.name);
                        setEditTopic(room.topic || '');
                        setShowEditModal(true);
                    }}
                    className="text-indigo-400 hover:text-indigo-600 transition-colors p-0.5"
                    title="Edit Room Details"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                    </svg>
                 </button>
             )}
            {isAdmin && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">Admin</span>}
          </div>
          {room.topic ? (
              <p className="text-[11px] text-indigo-600 font-medium italic truncate">{room.topic}</p>
          ) : (
              <p className="text-[10px] text-gray-500 font-mono">ID: {room.id} | {activeRoomUsers.length} users</p>
          )}
        </div>
        
        <button 
            onClick={() => setShowUserList(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors active:scale-95 shrink-0"
            title="Room Users"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
            </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-2 space-y-1 bg-white" 
        onClick={() => {
            setShowModMenuId(null);
            setShowEmojiPicker(false);
        }}
      >
        {roomMessages.map((msg) => {
          const isSystem = msg.type === MessageType.SYSTEM;
          const isCmd = msg.type === MessageType.CMD_RESPONSE;
          const isAction = msg.type === MessageType.ACTION;
          
          if (isSystem || isCmd) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className={`inline-block px-3 py-0.5 rounded-sm text-[10px] font-mono tracking-tight ${isCmd ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-gray-100 text-gray-500'}`}>
                  {msg.content}
                </span>
              </div>
            );
          }

          if (isAction) {
              return (
                <div key={msg.id} className="py-1 px-2 rounded hover:bg-gray-50 flex items-center gap-1">
                   <span className="text-[10px] text-gray-400 font-mono shrink-0 select-none">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <span className="text-sm font-bold italic text-fuchsia-600">
                      * {msg.content}
                   </span>
                </div>
              );
          }

          const isMe = msg.senderId === currentUser?.id;
          const usernameColor = getUsernameColor(msg.senderName, isMe);
          
          return (
            <div key={msg.id} className="relative group">
               <div className={`py-1 px-2 rounded hover:bg-gray-50 flex flex-row items-start gap-1 transition-colors ${isMe ? 'bg-indigo-50/30' : ''}`}>
                    <span className="text-[10px] text-gray-400 font-mono mt-[3px] shrink-0 select-none">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    <div className="text-sm leading-tight break-words flex-1">
                         <span 
                            className={`font-bold cursor-pointer hover:underline ${usernameColor}`}
                            onClick={(e) => {
                                if (isAdmin && !isMe) {
                                    e.stopPropagation();
                                    setShowModMenuId(msg.id === showModMenuId ? null : msg.id);
                                }
                            }}
                         >
                            {msg.senderName}
                         </span>
                         <span className="font-bold text-gray-400 mx-1">:</span>
                         <span className="text-gray-900">{msg.content}</span>
                    </div>
               </div>

              {/* Mod Menu */}
              {showModMenuId === msg.id && isAdmin && !isMe && (
                  <div className="absolute top-6 left-10 bg-white shadow-xl border border-gray-200 rounded z-20 flex flex-col text-xs font-bold overflow-hidden min-w-[120px]">
                      <div className="bg-gray-50 px-3 py-1 text-[10px] text-gray-400 border-b border-gray-100 uppercase tracking-wider">
                          Actions for {msg.senderName}
                      </div>
                      <button 
                        onClick={() => kickUser(msg.senderId)}
                        className="px-3 py-2 text-amber-600 hover:bg-amber-50 text-left w-full border-b border-gray-100"
                      >
                        Kick User
                      </button>
                      <button 
                        onClick={() => banUser(msg.senderId)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 text-left w-full"
                      >
                        Ban User
                      </button>
                  </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-50 p-2 border-t border-gray-200 relative">
        {showEmojiPicker && (
            <EmojiPicker onSelect={handleEmojiSelect} />
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
            }}
            className="text-gray-400 hover:text-indigo-500 p-2 transition-colors active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm shadow-sm outline-none"
          />
          <button 
            type="submit"
            className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            disabled={!input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>

      {/* User List Modal */}
      {showUserList && (
          <div 
             className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200"
             onClick={() => setShowUserList(false)}
          >
             <div 
                className="bg-white w-full max-w-xs rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
             >
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                        In Room ({activeRoomUsers.length})
                   </h3>
                   <button 
                        onClick={() => setShowUserList(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                   </button>
                </div>
                <div className="overflow-y-auto p-2 space-y-1">
                   {activeRoomUsers.map(u => (
                       <div 
                            key={u.id} 
                            className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors group"
                            onClick={() => { setShowUserList(false); viewUserProfile(u.id); }}
                       >
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs ring-2 ring-transparent group-hover:ring-indigo-200 transition-all overflow-hidden">
                              {u.photos && u.photos.length > 0 ? (
                                  <img src={u.photos[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                  u.username.charAt(0).toUpperCase()
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                               <p className={`font-bold text-sm truncate group-hover:text-indigo-700 ${getUsernameColor(u.username, u.id === currentUser?.id)}`}>
                                   {u.username}
                                   {u.id === currentUser?.id && <span className="text-xs text-gray-400 font-normal ml-1">(You)</span>}
                               </p>
                          </div>
                          {room.adminId === u.id && (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                  ADMIN
                              </span>
                          )}
                       </div>
                   ))}
                   {activeRoomUsers.length === 0 && (
                       <div className="text-center py-6 text-gray-400 text-sm">
                           No users found.
                       </div>
                   )}
                </div>
             </div>
          </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowEditModal(false)}
          >
              <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Room</h2>
                  <form onSubmit={handleSaveRoomDetails}>
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Room Name</label>
                          <input 
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                              required
                          />
                      </div>
                      <div className="mb-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topic</label>
                          <input 
                              type="text"
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
                              placeholder="Set a room topic..."
                              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                          />
                      </div>
                      <div className="flex gap-2">
                          <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
                          <Button type="submit" className="flex-1">Save</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatRoom;