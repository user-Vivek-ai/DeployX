import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  usageTokens?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  provider: string; // openai | gemini | anthropic
  model: string;   // model identifier
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const STORE_PATH = path.join(os.tmpdir(), 'deployx_chat_store.json');

let store: Record<string, Conversation> = {};

function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      store = JSON.parse(raw);
    }
  } catch {
    store = {};
  }
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

loadStore();

export class ChatStore {
  /** Create a new conversation for a user */
  static createConversation(userId: string, provider: string, model: string, title = 'New Conversation'): Conversation {
    const now = new Date().toISOString();
    const convo: Conversation = {
      id: crypto.randomUUID ? crypto.randomUUID() : `convo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      title,
      provider,
      model,
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    store[convo.id] = convo;
    saveStore();
    return convo;
  }

  static getConversation(id: string): Conversation | undefined {
    return store[id];
  }

  static listUserConversations(userId: string): Conversation[] {
    return Object.values(store)
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  static deleteConversation(id: string): boolean {
    if (store[id]) {
      delete store[id];
      saveStore();
      return true;
    }
    return false;
  }

  static renameConversation(id: string, newTitle: string): boolean {
    const convo = store[id];
    if (convo) {
      convo.title = newTitle;
      convo.updatedAt = new Date().toISOString();
      saveStore();
      return true;
    }
    return false;
  }

  static addMessage(convoId: string, role: 'user' | 'assistant', content: string, usageTokens?: number): Message | null {
    const convo = store[convoId];
    if (!convo) return null;
    const msg: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      role,
      content,
      createdAt: new Date().toISOString(),
      usageTokens
    };
    convo.messages.push(msg);
    convo.updatedAt = new Date().toISOString();
    saveStore();
    return msg;
  }
}
