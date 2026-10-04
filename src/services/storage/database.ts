import {
  Conversation,
  ChatMessage,
  MemoryEntry,
  TaskItem,
  SmartDevice,
  PCDeviceConfig,
  ProviderConfig,
  ShreyaSettings,
  DiagnosticResult,
} from '../../types';
import { SecurityManager } from '../security/securityManager';

const DB_VERSION = 2;

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'groq',
    name: 'Groq Cloud (Ultra Fast)',
    enabled: true,
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    availableModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    status: 'disconnected',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: true,
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    availableModels: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ],
    status: 'disconnected',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
    status: 'disconnected',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    status: 'disconnected',
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-Compatible (Ollama / Local)',
    enabled: false,
    apiKey: '',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
    availableModels: ['llama3', 'mistral', 'deepseek-r1', 'qwen2.5'],
    status: 'disconnected',
  },
];

export const DEFAULT_SETTINGS: ShreyaSettings = {
  assistantName: 'Shreya',
  userName: 'User',
  language: 'en-US',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceName: '',
  autoSpeak: true,
  continuousConversation: true,
  wakeWordEnabled: true,
  wakeWordPhrase: 'Hey Shreya',
  wakeWordSensitivity: 7,
  backgroundAssistantEnabled: false,
  micPausedInBackground: false,
  batteryMode: 'balanced',
  primaryProvider: 'groq',
  fallbackProvider: 'gemini',
  fallbackEnabled: true,
  personality: 'friendly',
  confirmDestructiveActions: true,
  enableSoundEffects: true,
};

export class AppDatabase {
  private static readonly CONV_KEY = 'shreya_conversations_v2';
  private static readonly MSG_KEY_PREFIX = 'shreya_msgs_v2_';
  private static readonly MEM_KEY = 'shreya_memories_v2';
  private static readonly TASK_KEY = 'shreya_tasks_v2';
  private static readonly DEV_KEY = 'shreya_devices_v2';
  private static readonly PC_KEY = 'shreya_pc_config_v2';
  private static readonly PROV_KEY = 'shreya_providers_v2';
  private static readonly SETTINGS_KEY = 'shreya_settings_v2';
  private static readonly DIAG_KEY = 'shreya_diagnostics_v2';

  public static initialize(): void {
    const currentVersion = parseInt(localStorage.getItem('shreya_db_version') || '0', 10);
    if (currentVersion < DB_VERSION) {
      this.runMigrations(currentVersion);
      localStorage.setItem('shreya_db_version', DB_VERSION.toString());
    }

    // Seed default providers if none exist
    if (!localStorage.getItem(this.PROV_KEY)) {
      this.saveProviders(DEFAULT_PROVIDERS);
    }

    // Seed settings if none exist
    if (!localStorage.getItem(this.SETTINGS_KEY)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  private static runMigrations(oldVersion: number): void {
    if (oldVersion < 1) {
      // First boot: set default keys and clear old prototypes if any
      console.log('Running DB migration to v1');
    }
    if (oldVersion < 2) {
      // Version 2 migration: ensure Google Sheets references & audio configs are added
      console.log('Running DB migration to v2');
    }
  }

  // --- SETTINGS ---
  public static getSettings(): ShreyaSettings {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: ShreyaSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // --- PROVIDERS ---
  public static getProviders(): ProviderConfig[] {
    try {
      const data = localStorage.getItem(this.PROV_KEY);
      const list: ProviderConfig[] = data ? JSON.parse(data) : DEFAULT_PROVIDERS;
      // Load decrypted secrets from secure storage
      return list.map((p) => ({
        ...p,
        apiKey: SecurityManager.getSecret(`api_key_${p.id}`),
      }));
    } catch {
      return DEFAULT_PROVIDERS;
    }
  }

  public static saveProviders(providers: ProviderConfig[]): void {
    // Separate API keys into secure storage and don't store plaintext in the list
    const stripped = providers.map((p) => {
      SecurityManager.storeSecret(`api_key_${p.id}`, p.apiKey || '');
      return {
        ...p,
        apiKey: '', // mask in JSON
      };
    });
    localStorage.setItem(this.PROV_KEY, JSON.stringify(stripped));
  }

  public static updateProvider(provider: ProviderConfig): void {
    const list = this.getProviders();
    const index = list.findIndex((p) => p.id === provider.id);
    if (index >= 0) {
      list[index] = provider;
    } else {
      list.push(provider);
    }
    this.saveProviders(list);
  }

  // --- CONVERSATIONS ---
  public static getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(this.CONV_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveConversations(convs: Conversation[]): void {
    localStorage.setItem(this.CONV_KEY, JSON.stringify(convs));
  }

  public static createConversation(title = 'New Conversation'): Conversation {
    const convs = this.getConversations();
    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    convs.unshift(newConv);
    this.saveConversations(convs);
    return newConv;
  }

  public static deleteConversation(id: string): void {
    const convs = this.getConversations().filter((c) => c.id !== id);
    this.saveConversations(convs);
    localStorage.removeItem(this.MSG_KEY_PREFIX + id);
  }

  public static renameConversation(id: string, newTitle: string): void {
    const convs = this.getConversations();
    const conv = convs.find((c) => c.id === id);
    if (conv) {
      conv.title = newTitle;
      conv.updatedAt = Date.now();
      this.saveConversations(convs);
    }
  }

  // --- MESSAGES ---
  public static getMessages(convId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(this.MSG_KEY_PREFIX + convId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveMessages(convId: string, messages: ChatMessage[]): void {
    localStorage.setItem(this.MSG_KEY_PREFIX + convId, JSON.stringify(messages));
    // update conv timestamp
    const convs = this.getConversations();
    const conv = convs.find((c) => c.id === convId);
    if (conv) {
      conv.updatedAt = Date.now();
      this.saveConversations(convs);
    }
  }

  public static addMessage(convId: string, message: ChatMessage): void {
    const msgs = this.getMessages(convId);
    msgs.push(message);
    this.saveMessages(convId, msgs);
  }

  // --- MEMORY ---
  public static getMemories(): MemoryEntry[] {
    try {
      const data = localStorage.getItem(this.MEM_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveMemories(memories: MemoryEntry[]): void {
    localStorage.setItem(this.MEM_KEY, JSON.stringify(memories));
  }

  public static addMemory(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): MemoryEntry {
    const memories = this.getMemories();
    const existingIndex = memories.findIndex(
      (m) => m.key.toLowerCase() === entry.key.toLowerCase()
    );
    const now = Date.now();
    let result: MemoryEntry;

    if (existingIndex >= 0) {
      memories[existingIndex] = {
        ...memories[existingIndex],
        ...entry,
        updatedAt: now,
      };
      result = memories[existingIndex];
    } else {
      result = {
        id: 'mem_' + now + '_' + Math.random().toString(36).substring(2, 6),
        ...entry,
        createdAt: now,
        updatedAt: now,
      };
      memories.unshift(result);
    }
    this.saveMemories(memories);
    return result;
  }

  public static deleteMemory(id: string): void {
    const memories = this.getMemories().filter((m) => m.id !== id);
    this.saveMemories(memories);
  }

  public static clearAllMemories(): void {
    localStorage.removeItem(this.MEM_KEY);
  }

  // --- TASKS ---
  public static getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(this.TASK_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveTasks(tasks: TaskItem[]): void {
    localStorage.setItem(this.TASK_KEY, JSON.stringify(tasks));
  }

  public static addTask(task: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const tasks = this.getTasks();
    const newItem: TaskItem = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...task,
      createdAt: Date.now(),
    };
    tasks.unshift(newItem);
    this.saveTasks(tasks);
    return newItem;
  }

  public static updateTask(id: string, updates: Partial<TaskItem>): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...updates };
      this.saveTasks(tasks);
    }
  }

  public static deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  }

  // --- DEVICES (Smart Home / ESP32 / Pi) ---
  public static getDevices(): SmartDevice[] {
    try {
      const data = localStorage.getItem(this.DEV_KEY);
      return data ? JSON.parse(data) : [
        {
          id: 'esp32_relay_01',
          name: 'Living Room Light (ESP32)',
          type: 'esp32',
          protocol: 'http',
          endpoint: 'http://192.168.1.105/relay',
          state: 'online',
          capabilities: ['power', 'toggle', 'dimmer'],
          payload: { state: false, brightness: 80 },
        },
        {
          id: 'rpi4_sensor_node',
          name: 'Home Environment Hub (Pi 4)',
          type: 'raspberry_pi',
          protocol: 'mqtt',
          endpoint: 'mqtt://192.168.1.200:1883',
          state: 'online',
          capabilities: ['temperature', 'humidity', 'camera'],
          payload: { temp: 24.5, humidity: 55 },
        },
      ];
    } catch {
      return [];
    }
  }

  public static saveDevices(devices: SmartDevice[]): void {
    localStorage.setItem(this.DEV_KEY, JSON.stringify(devices));
  }

  // --- PC COMPANION CONFIG ---
  public static getPCConfig(): PCDeviceConfig {
    try {
      const data = localStorage.getItem(this.PC_KEY);
      return data
        ? JSON.parse(data)
        : {
            id: 'pc_primary',
            name: 'My Workstation PC',
            ip: '192.168.1.150',
            port: 8089,
            authToken: 'shreya_pc_auth_token_9918',
            connected: false,
            stats: {
              cpu: 18,
              ram: 42,
              os: 'Linux / Windows 11',
              uptime: '4h 28m',
            },
          };
    } catch {
      return {
        id: 'pc_primary',
        name: 'My Workstation PC',
        ip: '192.168.1.150',
        port: 8089,
        authToken: 'shreya_pc_auth_token_9918',
        connected: false,
      };
    }
  }

  public static savePCConfig(config: PCDeviceConfig): void {
    localStorage.setItem(this.PC_KEY, JSON.stringify(config));
  }

  // --- DIAGNOSTICS LOGS ---
  public static getDiagnosticLogs(): DiagnosticResult[] {
    try {
      const data = localStorage.getItem(this.DIAG_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveDiagnosticLogs(logs: DiagnosticResult[]): void {
    localStorage.setItem(this.DIAG_KEY, JSON.stringify(logs.slice(0, 50)));
  }

  public static clearAllData(): void {
    const keepProviders = localStorage.getItem(this.PROV_KEY);
    localStorage.clear();
    if (keepProviders) {
      localStorage.setItem(this.PROV_KEY, keepProviders);
    }
    this.initialize();
  }
}
