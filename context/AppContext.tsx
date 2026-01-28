import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Room, Message, MessageType, AppView, UserStatus } from '../types';
import { MAX_ROOMS_PER_USER } from '../constants';
import { generateAIResponse } from '../services/geminiService';
import { initDB, dbService } from '../services/db';

interface AppContextType {
  currentUser: User | null;
  users: User[]; // Helper for friend lookup, partially implemented via on-demand fetch
  rooms: Room[];
  messages: Message[];
  activeRoomUsers: User[]; // Users currently in the active room
  currentView: AppView;
  activeRoomId: string | null;
  activeDmUser: User | null;
  viewedProfileUser: User | null;
  
  // Actions
  login: (username: string, password?: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  createRoom: (roomName: string) => Promise<boolean>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  startDirectMessage: (friendId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addFriend: (targetUserId: string) => Promise<void>;
  viewUserProfile: (userId: string) => Promise<void>;
  updateProfile: (bio: string, photos: string[], status: UserStatus) => Promise<void>;
  updateRoomDetails: (name: string, topic: string) => Promise<void>;
  kickUser: (userId: string) => Promise<void>;
  banUser: (userId: string) => Promise<void>;
  markRead: (roomId: string) => Promise<void>;
  setView: (view: AppView) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]); // We'll keep a cache of fetched users here
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clearedTimestamps, setClearedTimestamps] = useState<Record<string, number>>({});
  const [activeRoomUsers, setActiveRoomUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeDmUser, setActiveDmUser] = useState<User | null>(null);
  const [viewedProfileUser, setViewedProfileUser] = useState<User | null>(null);

  // Initialize DB
  useEffect(() => {
    initDB();
  }, []);

  // Poll for Rooms (Lobby refresh)
  useEffect(() => {
    if (currentView === AppView.LOBBY) {
      const fetchRooms = async () => {
        try {
          const remoteRooms = await dbService.getRooms();
          setRooms(remoteRooms);
        } catch (e) {
          console.error("Error fetching rooms", e);
        }
      };
      
      fetchRooms();
      const interval = setInterval(fetchRooms, 4000); // Slower polling for lobby
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Poll for Messages & Room Data (Active Room or DM)
  useEffect(() => {
    if (activeRoomId && (currentView === AppView.CHAT || currentView === AppView.DM)) {
      const fetchData = async () => {
        try {
          // 1. Fetch Messages
          const remoteMsgs = await dbService.getMessages(activeRoomId);
          const cutoff = clearedTimestamps[activeRoomId] || 0;
          setMessages(remoteMsgs.filter(m => m.timestamp > cutoff));

          // 2. If in Chat Room, fetch Room Details & Users
          if (currentView === AppView.CHAT) {
             const room = await dbService.getRoom(activeRoomId);
             
             if (room) {
                 // Kick/Ban Check: If I am not in the list anymore
                 if (currentUser && !room.users.includes(currentUser.id)) {
                     // We check against the DB truth
                     alert("You have been removed from this room.");
                     leaveRoom();
                     return;
                 }

                 // Fetch User Details for the list
                 if (room.users.length > 0) {
                    const roomUsers = await dbService.getUsersByIds(room.users);
                    setActiveRoomUsers(roomUsers);
                 } else {
                    setActiveRoomUsers([]);
                 }
                 
                 // Update rooms state to keep admin info fresh
                 setRooms(prev => {
                     const idx = prev.findIndex(r => r.id === room.id);
                     if (idx === -1) return prev; // Room not in lobby cache? ignore
                     const newRooms = [...prev];
                     newRooms[idx] = room;
                     return newRooms;
                 });
             } else {
                 // Room deleted
                 alert("Room no longer exists.");
                 leaveRoom();
             }
          }
        } catch (e) {
          console.error("Error fetching data", e);
        }
      };

      fetchData();
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [activeRoomId, currentView, currentUser, clearedTimestamps]);

  // Fetch friend details when current user changes
  useEffect(() => {
    if (currentUser?.friends) {
      const loadFriends = async () => {
        const friendPromises = currentUser.friends.map(fid => dbService.getUserById(fid));
        const fetched = await Promise.all(friendPromises);
        const validFriends = fetched.filter((u): u is User => u !== null);
        setUsers(prev => {
          // Merge avoiding duplicates
          const unique = new Map(prev.map(u => [u.id, u]));
          validFriends.forEach(u => unique.set(u.id, u));
          return Array.from(unique.values());
        });
      };
      loadFriends();
    }
  }, [currentUser?.friends]);

  const login = async (username: string, password?: string) => {
    try {
      const user = await dbService.getUser(username);
      if (user) {
        if (password && user.password && user.password !== password) {
          alert("Invalid password");
          return;
        }
        // Force online text on login
        setCurrentUser({ ...user, isOnline: true, status: 'Online' });
        // Update DB
        await dbService.updateUserProfile(user.id, user.bio || '', user.photos || [], 'Online');
        setCurrentView(AppView.LOBBY);
      } else {
        alert("User not found. Please register.");
      }
    } catch (e) {
      console.error(e);
      alert("Login failed due to connection error.");
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const existing = await dbService.getUser(username);
      if (existing) {
        alert("Username taken");
        return;
      }
      const newUser = await dbService.createUser(username, password);
      setCurrentUser(newUser);
      setCurrentView(AppView.LOBBY);
    } catch (e) {
      console.error(e);
      alert("Registration failed.");
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.AUTH);
    setActiveRoomId(null);
    setActiveDmUser(null);
    setMessages([]);
    setClearedTimestamps({});
    setActiveRoomUsers([]);
  };

  const createRoom = async (roomName: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Refresh rooms to check limit accurately
    const currentRooms = await dbService.getRooms();
    const userRooms = currentRooms.filter(r => r.adminId === currentUser.id);
    
    if (userRooms.length >= MAX_ROOMS_PER_USER) {
      alert(`You can only create ${MAX_ROOMS_PER_USER} rooms.`);
      return false;
    }

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: roomName,
      adminId: currentUser.id,
      users: [currentUser.id],
      isPrivate: false
    };

    await dbService.createRoom(newRoom);
    // Optimistic update
    setRooms(prev => [newRoom, ...prev]);
    return true;
  };

  const deleteRoom = async (roomId: string) => {
      if (!currentUser) return;
      await dbService.deleteRoom(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const joinRoom = async (roomId: string) => {
    if (!currentUser) return;
    
    // Check Ban Status
    const isBanned = await dbService.isBanned(roomId, currentUser.id);
    if (isBanned) {
        alert("You are banned from this room.");
        return;
    }

    setActiveRoomId(roomId);
    setCurrentView(AppView.CHAT);

    const sysMsg: Message = {
      id: Date.now().toString(),
      roomId,
      senderId: 'SYSTEM',
      senderName: 'System',
      content: `${currentUser.username} has entered the room.`,
      timestamp: Date.now(),
      type: MessageType.SYSTEM
    };
    
    // Update DB state
    await dbService.addUserToRoom(roomId, currentUser.id);
    await dbService.createMessage(sysMsg);
  };

  const startDirectMessage = async (friendId: string) => {
    if (!currentUser) return;
    
    let friend = users.find(u => u.id === friendId);
    if (!friend) {
        friend = await dbService.getUserById(friendId) || undefined;
    }
    
    if (friend) {
        setActiveDmUser(friend);
        // Create a unique room ID for the pair by sorting IDs.
        const dmId = [currentUser.id, friendId].sort().join('_');
        setActiveRoomId(dmId);
        setMessages([]); // Clear previous messages
        setCurrentView(AppView.DM);
    }
  };

  const viewUserProfile = async (userId: string) => {
    let user = users.find(u => u.id === userId);
    if (!user) {
        // Check active room users cache first
        user = activeRoomUsers.find(u => u.id === userId);
    }
    
    if (!user) {
        // Check if it is me
        if (currentUser && currentUser.id === userId) {
            user = currentUser;
        } else {
            // Fetch from DB
            user = await dbService.getUserById(userId) || undefined;
        }
    }

    if (user) {
        setViewedProfileUser(user);
        setCurrentView(AppView.PROFILE);
    } else {
        alert("User not found.");
    }
  };

  const updateProfile = async (bio: string, photos: string[], status: UserStatus) => {
      if (!currentUser) return;
      await dbService.updateUserProfile(currentUser.id, bio, photos, status);
      const updatedUser = { ...currentUser, bio, photos, status };
      setCurrentUser(updatedUser);
      setViewedProfileUser(updatedUser); // Update view if looking at self
  };

  const updateRoomDetails = async (name: string, topic: string) => {
      if (!currentUser || !activeRoomId) return;
      
      const room = rooms.find(r => r.id === activeRoomId);
      if (room && room.adminId === currentUser.id) {
          await dbService.updateRoom(activeRoomId, name, topic);
          // Optimistic
          setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, name, topic } : r));
      }
  };

  const leaveRoom = () => {
    if (!currentUser) return;

    // Only send exit message if we are in a group CHAT
    if (activeRoomId && currentView === AppView.CHAT) {
        const sysMsg: Message = {
          id: Date.now().toString(),
          roomId: activeRoomId,
          senderId: 'SYSTEM',
          senderName: 'System',
          content: `${currentUser.username} has left the room.`,
          timestamp: Date.now(),
          type: MessageType.SYSTEM
        };
        dbService.createMessage(sysMsg);
        
        // Remove from DB room users
        dbService.removeUserFromRoom(activeRoomId, currentUser.id);
    }
    
    // Clear active states
    setActiveRoomId(null);
    setActiveDmUser(null);
    setViewedProfileUser(null);
    setActiveRoomUsers([]);
    
    // Always return to Lobby
    setCurrentView(AppView.LOBBY);
  };

  const kickUser = async (targetUserId: string) => {
    if (!currentUser || !activeRoomId) return;
    
    const targetUser = await dbService.getUserById(targetUserId);
    if (!targetUser) return;

    await dbService.removeUserFromRoom(activeRoomId, targetUserId);
    
    const sysMsg: Message = {
      id: Date.now().toString(),
      roomId: activeRoomId,
      senderId: 'SYSTEM',
      senderName: 'System',
      content: `${targetUser.username} has been kicked by Admin.`,
      timestamp: Date.now(),
      type: MessageType.SYSTEM
    };
    await dbService.createMessage(sysMsg);
  };

  const banUser = async (targetUserId: string) => {
    if (!currentUser || !activeRoomId) return;

    const targetUser = await dbService.getUserById(targetUserId);
    if (!targetUser) return;

    await dbService.banUser(activeRoomId, targetUserId);
    await dbService.removeUserFromRoom(activeRoomId, targetUserId);

    const sysMsg: Message = {
      id: Date.now().toString(),
      roomId: activeRoomId,
      senderId: 'SYSTEM',
      senderName: 'System',
      content: `${targetUser.username} has been banned by Admin.`,
      timestamp: Date.now(),
      type: MessageType.SYSTEM
    };
    await dbService.createMessage(sysMsg);
  };

  const markRead = async (roomId: string) => {
      if (!currentUser) return;
      await dbService.markMessagesRead(roomId, currentUser.id);
      // Optimistically update local messages
      setMessages(prev => prev.map(m => 
          (m.roomId === roomId && m.senderId !== currentUser.id && !m.read) 
          ? { ...m, read: true } 
          : m
      ));
  };

  const addFriend = async (targetUserId: string) => {
    if (!currentUser) return;
    if (targetUserId === currentUser.id) return;
    
    if (currentUser.friends.includes(targetUserId)) {
        alert("Already friends.");
        return;
    }

    try {
      const targetUser = await dbService.getUserById(targetUserId);
      if (!targetUser) {
        alert("User ID not found.");
        return;
      }

      const updatedFriends = [...currentUser.friends, targetUserId];
      await dbService.updateUserFriends(currentUser.id, updatedFriends);
      
      const updatedUser = { ...currentUser, friends: updatedFriends };
      setCurrentUser(updatedUser);
      
      // Update local cache
      setUsers(prev => [...prev, targetUser]);
      alert("Friend added!");
    } catch (e) {
      console.error(e);
      alert("Failed to add friend.");
    }
  };

  const processCommand = async (text: string, roomId: string) => {
      if (!currentUser) return;
    
    const parts = text.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let responseMsg = '';

    switch (command) {
      case 'join':
        responseMsg = "Use the lobby to join rooms.";
        break;
      case 'clear':
        setClearedTimestamps(prev => ({ ...prev, [roomId]: Date.now() }));
        const clearedMsg: Message = {
            id: (Date.now() + 1).toString(),
            roomId,
            senderId: 'SYSTEM',
            senderName: 'System',
            content: "Chat history cleared locally.",
            timestamp: Date.now() + 1,
            type: MessageType.SYSTEM
        };
        setMessages([clearedMsg]);
        return;
      case 'msg':
         if (args.length < 2) {
             responseMsg = "Usage: /msg <username> <text>";
        } else {
            const targetName = args[0];
            const dmContent = args.slice(1).join(' ');
            let targetUser = users.find(u => u.username.toLowerCase() === targetName.toLowerCase());
            if (!targetUser) {
               targetUser = await dbService.getUser(targetName) || undefined;
            }
            if (targetUser) {
                const dmRoomId = [currentUser.id, targetUser.id].sort().join('_');
                const dmMessage: Message = {
                    id: Date.now().toString(),
                    roomId: dmRoomId,
                    senderId: currentUser.id,
                    senderName: currentUser.username,
                    content: `(PM) ${dmContent}`,
                    timestamp: Date.now(),
                    type: MessageType.TEXT
                };
                await dbService.createMessage(dmMessage);
                responseMsg = `Sent DM to ${targetUser.username}`;
            } else {
                responseMsg = `User ${targetName} not found.`;
            }
        }
        break;
      case 'kick':
        // Check if admin
        const currentRoom = rooms.find(r => r.id === roomId);
        if (currentRoom && currentRoom.adminId === currentUser.id) {
             const targetUsername = args[0];
             if (!targetUsername) {
                 responseMsg = "Usage: /kick <username>";
             } else {
                 const roomUserIds = currentRoom.users;
                 // Need to find user ID from name within this context or DB.
                 // We don't have easy synchronous name->id map for all users, try cache or DB fetch
                 let targetUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
                 if (!targetUser) {
                    targetUser = await dbService.getUser(targetUsername) || undefined;
                 }
                 
                 if (targetUser) {
                     if (roomUserIds.includes(targetUser.id)) {
                         await kickUser(targetUser.id);
                         // Kick function handles the system message
                         return;
                     } else {
                         responseMsg = "User not in this room.";
                     }
                 } else {
                     responseMsg = "User not found.";
                 }
             }
        } else {
            responseMsg = "Only admins can kick.";
        }
        break;
      case 'me':
        const action = args.join(' ');
        if (action) {
            const meMsg: Message = {
                id: Date.now().toString(),
                roomId,
                senderId: currentUser.id,
                senderName: currentUser.username,
                content: `${currentUser.username} ${action}`,
                timestamp: Date.now(),
                type: MessageType.ACTION
            };
            await dbService.createMessage(meMsg);
            setMessages(prev => [...prev, meMsg]);
            return;
        }
        break;
      case 'roll':
        const roll = Math.floor(Math.random() * 100) + 1;
        const rollMsg: Message = {
            id: Date.now().toString(),
            roomId,
            senderId: currentUser.id,
            senderName: currentUser.username,
            content: `🎲 rolled a ${roll}`,
            timestamp: Date.now(),
            type: MessageType.TEXT
        };
        await dbService.createMessage(rollMsg);
        setMessages(prev => [...prev, rollMsg]);
        return;
      case 'ai':
        const prompt = args.join(' ');
        if (!prompt) {
            responseMsg = "Usage: /ai <prompt>";
        } else {
            const tempId = Date.now().toString();
            setMessages(prev => [...prev, {
                id: tempId,
                roomId,
                senderId: 'AI_BOT',
                senderName: 'MaxBot',
                content: 'Thinking...',
                timestamp: Date.now(),
                type: MessageType.SYSTEM
            }]);
            const aiResponse = await generateAIResponse(prompt);
            setMessages(prev => prev.filter(m => m.id !== tempId));
             const aiMsg: Message = {
                id: Date.now().toString(),
                roomId,
                senderId: 'AI_BOT',
                senderName: 'MaxBot',
                content: aiResponse,
                timestamp: Date.now(),
                type: MessageType.TEXT
            };
             await dbService.createMessage(aiMsg);
             setMessages(prev => [...prev, aiMsg]);
             return; 
        }
        break;
      default:
        responseMsg = "Unknown command.";
    }

    if (responseMsg) {
        const sysResponse: Message = {
            id: Date.now().toString(),
            roomId,
            senderId: 'SYSTEM',
            senderName: 'System',
            content: responseMsg,
            timestamp: Date.now(),
            type: MessageType.CMD_RESPONSE
        };
        setMessages(prev => [...prev, sysResponse]);
    }
  };
  
  const handleSendMessage = async (content: string) => {
    if (!currentUser || !activeRoomId) return;

    if (content.startsWith('/')) {
        await processCommand(content, activeRoomId);
        return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      roomId: activeRoomId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      content,
      timestamp: Date.now(),
      type: MessageType.TEXT,
      read: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    try {
      await dbService.createMessage(newMessage);
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      rooms,
      messages,
      activeRoomUsers,
      currentView,
      activeRoomId,
      activeDmUser,
      viewedProfileUser,
      login,
      register,
      logout,
      createRoom,
      deleteRoom,
      joinRoom,
      leaveRoom,
      startDirectMessage,
      viewUserProfile,
      updateProfile,
      updateRoomDetails,
      sendMessage: handleSendMessage,
      addFriend,
      kickUser,
      banUser,
      markRead,
      setView: setCurrentView
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};