import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppView } from '../types';

const Navbar: React.FC = () => {
  const { currentUser, logout, currentView, leaveRoom, viewUserProfile, users, startDirectMessage } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('max99_sound') !== 'false');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('max99_notif') !== 'false');

  // Friends Modal State
  const [showFriends, setShowFriends] = useState(false);

  if (!currentUser) return null;

  const handleBack = () => {
    if (currentView === AppView.CHAT || currentView === AppView.DM || currentView === AppView.PROFILE) {
      leaveRoom();
    }
  };

  const toggleSound = () => {
      const newVal = !soundEnabled;
      setSoundEnabled(newVal);
      localStorage.setItem('max99_sound', String(newVal));
  };

  const toggleNotif = () => {
      const newVal = !notifEnabled;
      setNotifEnabled(newVal);
      localStorage.setItem('max99_notif', String(newVal));
      if (newVal) {
          // Request permission if enabling
          if ('Notification' in window && Notification.permission !== 'granted') {
              Notification.requestPermission();
          }
      }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Online': return 'bg-green-500';
        case 'Busy': return 'bg-red-500';
        case 'Away': return 'bg-amber-400';
        default: return 'bg-gray-300';
    }
  };

  const showBackButton = currentView === AppView.CHAT || currentView === AppView.DM || currentView === AppView.PROFILE;

  // Resolve friends list objects
  const friendList = currentUser.friends.map(fid => {
      return users.find(u => u.id === fid) || { id: fid, username: 'Loading...', status: 'Offline', photos: [] } as any;
  });

  return (
    <>
    <nav className="bg-indigo-600 text-white shadow-md z-50 sticky top-0 w-full h-14 flex items-center justify-between px-4 relative">
      {/* Left Section: Back Button or Friend List Button */}
      <div className="flex items-center z-10">
        {showBackButton ? (
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-indigo-500 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={() => setShowFriends(true)}
            className="p-2 -ml-2 hover:bg-indigo-500 rounded-full transition-colors flex items-center gap-2"
            title="Friend List"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
             </svg>
          </button>
        )}
      </div>

      {/* Center Section: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="font-bold text-xl tracking-tight select-none">max99</h1>
      </div>

      {/* Right Section: Menu */}
      <div className="relative z-10">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded transition-colors ${menuOpen ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setMenuOpen(false)}
            ></div>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-20 text-gray-800 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
              <div 
                className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3"
                onClick={() => { setMenuOpen(false); viewUserProfile(currentUser.id); }}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs overflow-hidden">
                     {currentUser.photos && currentUser.photos.length > 0 ? (
                         <img src={currentUser.photos[0]} alt="Avatar" className="w-full h-full object-cover"/>
                     ) : currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold truncate text-indigo-600 text-sm">@{currentUser.username}</p>
                    <p className="text-[10px] text-gray-400">ID: {currentUser.id}</p>
                </div>
              </div>
              
              <div className="py-1">
                  <button 
                    onClick={() => { setMenuOpen(false); setShowSettings(true); }} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 3.292 3.292 0 005.484 0 .75.75 0 00.515-1.076A11.448 11.448 0 0110 8a6 6 0 006-6zM8 15a2 2 0 004 0H8z" clipRule="evenodd" />
                    </svg>
                    Notifications & Sound
                  </button>
              </div>

              <div className="border-t border-gray-100 mt-1 pt-1">
                  <button 
                    onClick={() => { setMenuOpen(false); logout(); }} 
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                       <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                       <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                    </svg>
                    Sign Out
                  </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
    
    {/* Settings Modal */}
    {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 text-lg">App Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="bg-gray-200 p-1 rounded-full text-gray-500 hover:bg-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-5 space-y-6">
                    {/* Notification Toggle */}
                    <div className="flex items-center justify-between group cursor-pointer" onClick={toggleNotif}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full transition-colors ${notifEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                  <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9c.465 1.418 1.779 2.35 3.248 2.35 1.469 0 2.783-.932 3.248-2.35a25.547 25.547 0 01-6.496 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Notifications</p>
                                <p className="text-xs text-gray-500">Push alerts & popups</p>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${notifEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between group cursor-pointer" onClick={toggleSound}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full transition-colors ${soundEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                               </svg>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Sound</p>
                                <p className="text-xs text-gray-500">In-app sound effects</p>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${soundEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )}

    {/* Friends Modal */}
    {showFriends && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowFriends(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 text-lg">My Friends</h3>
                    <button onClick={() => setShowFriends(false)} className="bg-gray-200 p-1 rounded-full text-gray-500 hover:bg-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {friendList.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">No friends yet.</div>
                    ) : (
                        friendList.map((friend) => (
                           <div key={friend.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 cursor-pointer" onClick={() => { setShowFriends(false); startDirectMessage(friend.id); }}>
                               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                                   {friend.photos && friend.photos.length > 0 ? (
                                       <img src={friend.photos[0]} alt="" className="w-full h-full object-cover"/>
                                   ) : (
                                       friend.username.charAt(0).toUpperCase()
                                   )}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                       <p className="font-bold text-gray-800 truncate">{friend.username}</p>
                                       <span className={`w-2 h-2 rounded-full ${getStatusColor(friend.status)}`}></span>
                                   </div>
                                   <p className="text-xs text-gray-500 truncate">{friend.status || 'Offline'}</p>
                               </div>
                               <button className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
                                   MSG
                               </button>
                           </div> 
                        ))
                    )}
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Navbar;