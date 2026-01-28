import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { UserStatus } from '../types';

const Profile: React.FC = () => {
  const { viewedProfileUser, currentUser, startDirectMessage, addFriend, updateProfile, rooms, deleteRoom } = useApp();
  
  const isMe = viewedProfileUser?.id === currentUser?.id;
  const isFriend = currentUser?.friends.includes(viewedProfileUser?.id || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState(viewedProfileUser?.bio || '');
  const [statusInput, setStatusInput] = useState<UserStatus>(viewedProfileUser?.status || 'Online');
  const [photosInput, setPhotosInput] = useState<string[]>(viewedProfileUser?.photos || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Carousel State
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
      // Reset photo index when viewing a different user
      setActivePhotoIndex(0);
      // Update inputs when viewed user changes
      if (viewedProfileUser) {
          setBioInput(viewedProfileUser.bio || '');
          setStatusInput(viewedProfileUser.status || 'Online');
          setPhotosInput(viewedProfileUser.photos || []);
      }
  }, [viewedProfileUser]);

  if (!viewedProfileUser) return <div className="p-10 text-center text-gray-500">Loading profile...</div>;

  const handleSave = async () => {
      await updateProfile(bioInput, photosInput, statusInput);
      setIsEditing(false);
  };
  
  const handleAddPhotoUrl = () => {
      if (newPhotoUrl && photosInput.length < 6) {
          setPhotosInput([...photosInput, newPhotoUrl]);
          setNewPhotoUrl('');
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photosInput.length >= 6) {
        alert("Maximum 6 photos allowed.");
        return;
    }

    if (file.size > 1024 * 500) { // 500KB limit to be nice to the DB
        alert("Image too large. Max 500KB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            setPhotosInput(prev => [...prev, reader.result as string]);
        }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleRemovePhoto = (index: number) => {
      setPhotosInput(photosInput.filter((_, i) => i !== index));
  };
  
  const handleMakeAvatar = (index: number) => {
      if (index === 0) return;
      const newPhotos = [...photosInput];
      const selected = newPhotos[index];
      newPhotos.splice(index, 1);
      newPhotos.unshift(selected);
      setPhotosInput(newPhotos);
  };

  // Helper for Status Color
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Online': return 'bg-green-100 text-green-700 border-green-200';
          case 'Busy': return 'bg-red-100 text-red-700 border-red-200';
          case 'Away': return 'bg-amber-100 text-amber-700 border-amber-200';
          default: return 'bg-gray-100 text-gray-500 border-gray-200';
      }
  };
  
  const myCreatedRooms = rooms.filter(r => r.adminId === viewedProfileUser.id);
  const photos = viewedProfileUser.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  // Carousel Logic
  const handleNextPhoto = () => {
      if (photos.length <= 1) return;
      setActivePhotoIndex(prev => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
      if (photos.length <= 1) return;
      setActivePhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      
      if (Math.abs(diff) > 50) {
          if (diff > 0) handleNextPhoto();
          else handlePrevPhoto();
      }
      touchStartX.current = null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-gray-100 p-4 overflow-y-auto">
       <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center max-w-sm mx-auto w-full border border-gray-200">
          
          {/* Avatar / Carousel */}
          <div 
            className={`relative group mb-3 ${hasMultiplePhotos ? 'cursor-pointer' : ''} select-none touch-pan-y`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={(e) => {
                // Determine if click was left or right side for desktop/click nav
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x > rect.width / 2) handleNextPhoto();
                else handlePrevPhoto();
            }}
          >
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner overflow-hidden ring-4 ring-indigo-50 relative z-10">
                {photos.length > 0 ? (
                    <img 
                        key={activePhotoIndex} // Force re-render for simple animation effect
                        src={photos[activePhotoIndex]} 
                        alt="Avatar" 
                        className="w-full h-full object-cover animate-in fade-in duration-300" 
                    />
                ) : (
                    viewedProfileUser.username.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Desktop Hover Arrows */}
              {hasMultiplePhotos && (
                  <>
                    <div className="absolute top-1/2 -left-8 -translate-y-1/2 p-2 text-gray-300 hover:text-indigo-400 hidden sm:block transition-colors" title="Previous">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </div>
                    <div className="absolute top-1/2 -right-8 -translate-y-1/2 p-2 text-gray-300 hover:text-indigo-400 hidden sm:block transition-colors" title="Next">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                  </>
              )}
          </div>
          
          {/* Navigation Dots */}
          {hasMultiplePhotos && (
              <div className="flex gap-1.5 mb-4 justify-center">
                  {photos.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(idx); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activePhotoIndex ? 'bg-indigo-600 scale-125' : 'bg-gray-300 hover:bg-indigo-300'}`}
                        aria-label={`View photo ${idx + 1}`}
                      />
                  ))}
              </div>
          )}
          
          <h2 className={`text-2xl font-black text-gray-900 tracking-tight ${!hasMultiplePhotos ? 'mt-2' : ''}`}>{viewedProfileUser.username}</h2>
          <p className="text-sm text-gray-500 mb-2 font-mono">ID: {viewedProfileUser.id}</p>
          
          {isEditing ? (
              <div className="mb-6">
                  <select 
                    value={statusInput} 
                    onChange={(e) => setStatusInput(e.target.value as UserStatus)}
                    className="bg-white border border-gray-300 text-gray-700 text-xs font-bold uppercase py-1 px-3 rounded outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                      <option value="Online">Online</option>
                      <option value="Away">Away</option>
                      <option value="Busy">Busy</option>
                      <option value="Offline">Offline</option>
                  </select>
              </div>
          ) : (
             <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6 border ${getStatusColor(viewedProfileUser.status)}`}>
                 {viewedProfileUser.status || 'Online'}
             </div>
          )}

          {/* Bio Section */}
          <div className="w-full mb-6 text-center">
             <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">About</h3>
             {isEditing ? (
                 <div className="relative">
                    <textarea 
                        className="w-full border rounded p-2 text-sm text-gray-700 focus:border-indigo-500 outline-none resize-none shadow-inner"
                        rows={3}
                        value={bioInput}
                        maxLength={150}
                        onChange={(e) => setBioInput(e.target.value)}
                        placeholder="Write something about yourself..."
                    />
                    <div className="text-[10px] text-gray-400 text-right">{bioInput.length}/150</div>
                 </div>
             ) : (
                 <p className="text-sm text-gray-700 italic break-words px-4">
                     {viewedProfileUser.bio || "No bio set."}
                 </p>
             )}
          </div>

          {/* Photos/Avatar Section */}
          <div className="w-full mb-8">
             <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 text-center">Gallery Management</h3>
             
             {isEditing && (
                 <div className="space-y-3 mb-4">
                     <p className="text-[10px] text-gray-500 text-center bg-blue-50 p-2 rounded">
                        The first photo is your <b>Main Avatar</b>. Click a photo to make it main.
                     </p>
                     
                     {/* URL Input */}
                     <div className="flex gap-2">
                         <input 
                            type="text"
                            value={newPhotoUrl}
                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                            placeholder="Paste Image URL..."
                            className="flex-1 border rounded px-2 py-1 text-xs outline-none"
                         />
                         <button 
                            onClick={handleAddPhotoUrl}
                            type="button"
                            disabled={photosInput.length >= 6 || !newPhotoUrl}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 rounded text-xs font-bold disabled:opacity-50"
                         >
                            Add
                         </button>
                     </div>
                     
                     {/* File Upload */}
                     <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="photo-upload"
                            onChange={handleFileUpload}
                            disabled={photosInput.length >= 6}
                        />
                        <label 
                            htmlFor="photo-upload"
                            className={`block text-center border-2 border-dashed border-gray-300 rounded p-2 text-xs text-gray-500 font-bold cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-colors ${photosInput.length >= 6 ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            + Upload from Device
                        </label>
                     </div>
                 </div>
             )}
             
             <div className="grid grid-cols-3 gap-2">
                 {(isEditing ? photosInput : viewedProfileUser.photos || []).map((url, idx) => (
                     <div 
                        key={idx} 
                        className={`aspect-square bg-gray-100 rounded overflow-hidden relative group shadow-sm border ${idx === 0 ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'} cursor-pointer`}
                        onClick={() => isEditing && handleMakeAvatar(idx)}
                     >
                         <img src={url} alt="Profile" className="w-full h-full object-cover" />
                         {idx === 0 && (
                             <span className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[8px] font-bold text-center py-0.5 uppercase">
                                 Avatar
                             </span>
                         )}
                         {isEditing && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleRemovePhoto(idx); }}
                                className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:opacity-100 shadow-md"
                             >
                                 ×
                             </button>
                         )}
                     </div>
                 ))}
                 {(isEditing ? photosInput : viewedProfileUser.photos || []).length === 0 && !isEditing && (
                     <div className="col-span-3 text-center text-gray-400 text-xs py-4">No photos added.</div>
                 )}
             </div>
             {isEditing && (
                 <p className="text-[10px] text-gray-400 mt-1 text-center">{photosInput.length}/6 photos</p>
             )}
          </div>
          
          {/* User's Created Rooms List */}
          {myCreatedRooms.length > 0 && (
              <div className="w-full mb-8">
                  <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 text-center">
                      {isMe ? 'My Chatrooms' : `${viewedProfileUser.username}'s Rooms`}
                  </h3>
                  <div className="space-y-2">
                      {myCreatedRooms.map(room => (
                          <div key={room.id} className="bg-gray-50 border border-gray-200 rounded p-2 flex justify-between items-center">
                              <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm truncate text-gray-800">{room.name}</div>
                                  <div className="text-[10px] text-gray-500 truncate">{room.topic || 'No topic'}</div>
                              </div>
                              {isMe && isEditing && (
                                  <button 
                                    onClick={() => deleteRoom(room.id)}
                                    className="text-red-500 hover:text-red-700 p-1 ml-2 text-xs font-bold"
                                  >
                                      DELETE
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div className="w-full space-y-3">
             {isMe ? (
                <>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button variant="secondary" fullWidth onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button variant="primary" fullWidth onClick={handleSave}>Save</Button>
                        </div>
                    ) : (
                        <Button variant="secondary" fullWidth onClick={() => {
                            setIsEditing(true);
                            setBioInput(viewedProfileUser.bio || '');
                            setStatusInput(viewedProfileUser.status || 'Online');
                            setPhotosInput(viewedProfileUser.photos || []);
                        }}>
                            Edit Profile
                        </Button>
                    )}
                </>
             ) : (
                <>
                  <Button fullWidth onClick={() => startDirectMessage(viewedProfileUser.id)}>
                    Send Message
                  </Button>
                  {!isFriend ? (
                     <Button variant="secondary" fullWidth onClick={() => addFriend(viewedProfileUser.id)}>
                        Add Friend
                     </Button>
                  ) : (
                      <div className="text-center text-xs font-bold text-gray-400 uppercase py-2">
                          <span className="mr-1">✓</span> Friend
                      </div>
                  )}
                </>
             )}
          </div>
       </div>
    </div>
  );
};
export default Profile;