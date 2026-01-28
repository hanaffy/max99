export type UserStatus = 'Online' | 'Busy' | 'Away' | 'Offline';

export interface User {
  id: string; // Permanent ID
  username: string;
  password?: string; // Stored locally for demo
  friends: string[]; // List of friend IDs
  status: UserStatus;
  isOnline: boolean; // Technical connection status (websocket/polling)
  bio?: string;
  photos?: string[];
}

export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  CMD_RESPONSE = 'CMD_RESPONSE',
  ACTION = 'ACTION',
}

export interface Message {
  id: string;
  roomId: string; // Can be a chatroom ID or a DM ID (composed of two user IDs)
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: MessageType;
  read?: boolean;
}

export interface Room {
  id: string;
  name: string;
  topic?: string;
  adminId: string; // Creator is admin
  users: string[]; // Active users in room
  isPrivate: boolean;
}

export enum AppView {
  AUTH = 'AUTH',
  LOBBY = 'LOBBY',
  CHAT = 'CHAT',
  DM = 'DM',
  PROFILE = 'PROFILE'
}

export interface CommandResult {
  success: boolean;
  message: string;
}