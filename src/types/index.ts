export type AIProviderId = 'groq' | 'openai' | 'gemini' | 'claude' | 'custom' | 'local';

export type AssistantLanguage = 'en-US' | 'hi-IN' | 'hinglish';

export type PersonalityMode = 'efficient' | 'friendly' | 'analytical' | 'creative' | 'concise';

export type AssistantVoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface ProviderConfig {
  id: AIProviderId;
  name: string;
  enabled: boolean;
  apiKey: string; // encrypted in storage, masked in UI
  baseUrl: string;
  model: string;
  availableModels: string[];
  maxTokens?: number;
  temperature?: number;
  status: 'connected' | 'disconnected' | 'invalid_key' | 'rate_limited' | 'timeout' | 'error';
  latencyMs?: number;
  lastTested?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  skillExecuted?: {
    id: string;
    name: string;
    summary: string;
    data?: any;
    error?: string;
  };
  audioPlayed?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export type MemoryCategory = 'short_term' | 'long_term' | 'preference' | 'task' | 'sheets_ref';

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  createdAt: number;
  updatedAt: number;
  confidence?: number;
  source?: string;
  sensitive?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  syncedToSheets?: boolean;
  createdAt: number;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'esp32' | 'raspberry_pi' | 'relay' | 'sensor' | 'smart_light' | 'pc';
  protocol: 'http' | 'mqtt' | 'ble' | 'websocket';
  endpoint: string;
  state: 'online' | 'offline' | 'pairing';
  capabilities: string[];
  lastPing?: number;
  payload?: Record<string, any>;
}

export interface PCDeviceConfig {
  id: string;
  name: string;
  ip: string;
  port: number;
  authToken: string;
  connected: boolean;
  stats?: {
    cpu: number;
    ram: number;
    os: string;
    uptime: string;
  };
}

export interface PermissionStatusItem {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  requiredFor: string;
  type: 'microphone' | 'speech' | 'notifications' | 'bluetooth' | 'storage' | 'sheets' | 'wake_lock';
}

export interface DiagnosticResult {
  subsystem: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  message: string;
  details?: string;
  timestamp: number;
}

export interface ShreyaSettings {
  assistantName: string;
  userName: string;
  language: AssistantLanguage;
  voiceSpeed: number; // 0.5 to 2.0
  voicePitch: number; // 0.8 to 1.2
  voiceName: string;
  autoSpeak: boolean;
  continuousConversation: boolean;
  wakeWordEnabled: boolean;
  wakeWordPhrase: string;
  wakeWordSensitivity: number; // 1 - 10
  backgroundAssistantEnabled: boolean;
  micPausedInBackground: boolean;
  batteryMode: 'performance' | 'balanced' | 'saver';
  primaryProvider: AIProviderId;
  fallbackProvider: AIProviderId;
  fallbackEnabled: boolean;
  personality: PersonalityMode;
  confirmDestructiveActions: boolean;
  enableSoundEffects: boolean;
  activeSpreadsheetId?: string;
  activeSpreadsheetTitle?: string;
}
