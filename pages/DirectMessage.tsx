import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Message, MessageType } from '../types';
import EmojiPicker from '../components/EmojiPicker';

const DirectMessage: React.FC = () => {
  const { messages, activeRoomId, activeDmUser, sendMessage, currentUser, markRead, users } = useApp();
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Try to find the user in the live users list (friends) to get real-time status updates, 
  // otherwise fall back to the snapshot created when starting the DM.
  const targetUser = users.find(u => u.id === activeDmUser?.id) || activeDmUser;

  // Filter messages for current DM room
  const dmMessages = messages.filter(m => m.roomId === activeRoomId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages]);

  // Mark as read when entering or receiving messages
  useEffect(() => {
    if (activeRoomId && currentUser) {
        markRead(activeRoomId);
    }
  }, [activeRoomId, dmMessages.length, currentUser]); // Simple trigger on new messages

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

  const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Online': return 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]';
        case 'Busy': return 'bg-red-500';
        case 'Away': return 'bg-amber-400';
        default: return 'bg-gray-300';
    }
  };

  const getUsernameColor = (name: string) => {
    const len = name.length;
    if (len === 1) return 'text-red-600';
    if (len === 2) return 'text-yellow-600';
    if (len === 3) return 'text-purple-600';
    return 'text-gray-700';
  };

  if (!targetUser) return <div>Loading DM...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-gray-100">
      {/* Header Info */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-200 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm ring-2 ring-white shadow-sm overflow-hidden">
                {targetUser.photos && targetUser.photos.length > 0 ? (
                    <img src={targetUser.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                    targetUser.username.charAt(0).toUpperCase()
                )}
            </div>
            <div>
                <h2 className={`font-bold leading-tight ${getUsernameColor(targetUser.username)}`}>@{targetUser.username}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(targetUser.status || 'Offline')}`}></span>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                        {targetUser.status || 'Offline'}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3" 
        onClick={() => setShowEmojiPicker(false)}
      >
        {dmMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
                Start a conversation with {targetUser.username}
            </div>
        )}
        
        {dmMessages.map((msg) => {
          const isSystem = msg.type === MessageType.SYSTEM;
          const isCmd = msg.type === MessageType.CMD_RESPONSE;
          const isAction = msg.type === MessageType.ACTION;
          
          if (isSystem || isCmd) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${isCmd ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'}`}>
                  {msg.content}
                </span>
              </div>
            );
          }

          if (isAction) {
              return (
                <div key={msg.id} className="text-center my-2">
                   <span className="text-sm font-bold italic text-fuchsia-600">
                      * {msg.content}
                   </span>
                </div>
              );
          }

          const isMe = msg.senderId === currentUser?.id;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-0.5">
                 {!isMe && (
                     <span className={`font-bold text-xs ${getUsernameColor(msg.senderName)}`}>{msg.senderName}</span>
                 )}
                <span className="text-[10px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm break-words max-w-[85%] relative ${
                  isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none pr-9' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
              }`}>
                {msg.content}
                {isMe && (
                    <div className="absolute bottom-1 right-2">
                         {/* Check marks */}
                         {msg.read ? (
                            // Double Tick Blue (Read)
                            <div className="flex -space-x-1">
                                <span className="text-blue-300 text-[10px]">✓</span>
                                <span className="text-blue-300 text-[10px]">✓</span>
                            </div>
                         ) : (
                             // Double Tick Grey (Sent/Delivered)
                             <div className="flex -space-x-1">
                                <span className="text-white/60 text-[10px]">✓</span>
                                <span className="text-white/60 text-[10px]">✓</span>
                            </div>
                         )}
                    </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-2 border-t border-gray-200 relative">
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
            placeholder={`Message @${targetUser.username}...`}
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm outline-none"
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
    </div>
  );
};

export default DirectMessage;