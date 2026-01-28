import { Pool } from '@neondatabase/serverless';
import { User, Room, Message, MessageType, UserStatus } from '../types';

// Connection string provided by user
const connectionString = 'postgresql://neondb_owner:npg_utYl0dn2LSPa@ep-lingering-paper-ah24ba4p-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

export const initDB = async () => {
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        friends JSONB DEFAULT '[]',
        is_online BOOLEAN DEFAULT false
      );
    `);
    
    // Add columns for Profile features if they don't exist
    await client.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await client.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'`);
    // Add status column
    await client.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Online'`);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_rooms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        admin_id VARCHAR(255) NOT NULL,
        users JSONB DEFAULT '[]',
        is_private BOOLEAN DEFAULT false,
        created_at BIGINT
      );
    `);

    // Add topic column
    await client.query(`ALTER TABLE app_rooms ADD COLUMN IF NOT EXISTS topic TEXT`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_messages (
        id VARCHAR(255) PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL
      );
    `);
    
    // Add column for Read Receipts
    await client.query(`ALTER TABLE app_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_bans (
        room_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at BIGINT,
        PRIMARY KEY (room_id, user_id)
      );
    `);

    client.release();
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
};

export const dbService = {
  // --- USERS ---
  async createUser(username: string, password?: string): Promise<User> {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: User = {
      id,
      username,
      password,
      friends: [],
      status: 'Online',
      isOnline: true,
      bio: '',
      photos: []
    };
    
    await pool.query(
      'INSERT INTO app_users (id, username, password, friends, is_online, bio, photos, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [newUser.id, newUser.username, newUser.password, JSON.stringify(newUser.friends), newUser.isOnline, '', '[]', 'Online']
    );
    return newUser;
  },

  async getUser(username: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM app_users WHERE username = $1', [username]);
    if (rows.length === 0) return null;
    
    const u = rows[0];
    return {
      id: u.id,
      username: u.username,
      password: u.password,
      friends: u.friends || [],
      status: (u.status as UserStatus) || 'Online',
      isOnline: u.is_online,
      bio: u.bio || '',
      photos: u.photos || []
    };
  },
  
  async getUserById(id: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM app_users WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      username: u.username,
      password: u.password,
      friends: u.friends || [],
      status: (u.status as UserStatus) || 'Online',
      isOnline: u.is_online,
      bio: u.bio || '',
      photos: u.photos || []
    };
  },

  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    // Parameterized query for array
    const { rows } = await pool.query('SELECT * FROM app_users WHERE id = ANY($1)', [ids]);
    return rows.map(u => ({
      id: u.id,
      username: u.username,
      password: u.password,
      friends: u.friends || [],
      status: (u.status as UserStatus) || 'Online',
      isOnline: u.is_online,
      bio: u.bio || '',
      photos: u.photos || []
    }));
  },

  async updateUserFriends(userId: string, friends: string[]) {
    await pool.query('UPDATE app_users SET friends = $1 WHERE id = $2', [JSON.stringify(friends), userId]);
  },

  async updateUserProfile(userId: string, bio: string, photos: string[], status: UserStatus) {
    await pool.query(
        'UPDATE app_users SET bio = $1, photos = $2, status = $3 WHERE id = $4', 
        [bio, JSON.stringify(photos), status, userId]
    );
  },

  // --- ROOMS ---
  async getRooms(): Promise<Room[]> {
    const { rows } = await pool.query('SELECT * FROM app_rooms ORDER BY created_at DESC LIMIT 50');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      topic: r.topic || '',
      adminId: r.admin_id,
      users: r.users || [],
      isPrivate: r.is_private
    }));
  },

  async getRoom(roomId: string): Promise<Room | null> {
    const { rows } = await pool.query('SELECT * FROM app_rooms WHERE id = $1', [roomId]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      topic: r.topic || '',
      adminId: r.admin_id,
      users: r.users || [],
      isPrivate: r.is_private
    };
  },

  async createRoom(room: Room) {
    await pool.query(
      'INSERT INTO app_rooms (id, name, topic, admin_id, users, is_private, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [room.id, room.name, room.topic || '', room.adminId, JSON.stringify(room.users), room.isPrivate, Date.now()]
    );
  },

  async updateRoom(roomId: string, name: string, topic: string) {
    await pool.query(
        'UPDATE app_rooms SET name = $1, topic = $2 WHERE id = $3',
        [name, topic, roomId]
    );
  },

  async deleteRoom(roomId: string) {
      await pool.query('DELETE FROM app_rooms WHERE id = $1', [roomId]);
      // Also cleanup messages and bans ideally, but keeping simple for now
  },
  
  async addUserToRoom(roomId: string, userId: string) {
     const { rows } = await pool.query('SELECT users FROM app_rooms WHERE id = $1', [roomId]);
     if (rows.length > 0) {
         let users: string[] = rows[0].users || [];
         if (!users.includes(userId)) {
             users.push(userId);
             await pool.query('UPDATE app_rooms SET users = $1 WHERE id = $2', [JSON.stringify(users), roomId]);
         }
     }
  },

  async removeUserFromRoom(roomId: string, userId: string) {
    const { rows } = await pool.query('SELECT users FROM app_rooms WHERE id = $1', [roomId]);
    if (rows.length > 0) {
        let users: string[] = rows[0].users || [];
        if (users.includes(userId)) {
            users = users.filter(u => u !== userId);
            await pool.query('UPDATE app_rooms SET users = $1 WHERE id = $2', [JSON.stringify(users), roomId]);
        }
    }
  },

  // --- MODERATION ---
  async banUser(roomId: string, userId: string) {
    await pool.query(
        'INSERT INTO app_bans (room_id, user_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', 
        [roomId, userId, Date.now()]
    );
  },

  async isBanned(roomId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query('SELECT 1 FROM app_bans WHERE room_id = $1 AND user_id = $2', [roomId, userId]);
    return rows.length > 0;
  },

  // --- MESSAGES ---
  async getMessages(roomId: string): Promise<Message[]> {
    const { rows } = await pool.query(
      'SELECT * FROM app_messages WHERE room_id = $1 ORDER BY timestamp ASC LIMIT 100', 
      [roomId]
    );
    return rows.map(m => ({
      id: m.id,
      roomId: m.room_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      content: m.content,
      timestamp: Number(m.timestamp),
      type: m.type as MessageType,
      read: m.is_read || false
    }));
  },

  async createMessage(msg: Message) {
    await pool.query(
      'INSERT INTO app_messages (id, room_id, sender_id, sender_name, content, timestamp, type, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [msg.id, msg.roomId, msg.senderId, msg.senderName, msg.content, msg.timestamp, msg.type, false]
    );
  },

  async markMessagesRead(roomId: string, userId: string) {
    // Mark messages as read where I am the recipient (so sender != me)
    await pool.query(
      'UPDATE app_messages SET is_read = true WHERE room_id = $1 AND sender_id != $2 AND is_read = false',
      [roomId, userId]
    );
  }
};
