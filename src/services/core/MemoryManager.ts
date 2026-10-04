import { MemoryEntry, MemoryCategory } from '../../types';
import { AppDatabase } from '../storage/database';

export class MemoryManager {
  public static save(
    key: string,
    value: string,
    category: MemoryCategory = 'long_term',
    sensitive = false
  ): MemoryEntry {
    return AppDatabase.addMemory({
      key,
      value,
      category,
      sensitive,
      confidence: 1.0,
      source: 'user_direct',
    });
  }

  public static retrieve(key: string): MemoryEntry | undefined {
    const list = AppDatabase.getMemories();
    return list.find((m) => m.key.toLowerCase().includes(key.toLowerCase()));
  }

  public static search(query: string): MemoryEntry[] {
    const list = AppDatabase.getMemories();
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.key.toLowerCase().includes(q) ||
        m.value.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }

  public static delete(id: string): void {
    AppDatabase.deleteMemory(id);
  }

  public static clearAll(): void {
    AppDatabase.clearAllMemories();
  }

  /**
   * Generates a context block of relevant memories to inject into system prompt
   */
  public static getContextSummary(): string {
    const memories = AppDatabase.getMemories();
    if (memories.length === 0) return '';

    const lines = memories.slice(0, 15).map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
    return `\n### RECALLED USER MEMORIES:\n${lines.join('\n')}\n`;
  }
}
