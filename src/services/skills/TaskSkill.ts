import { AssistantSkill, SkillResult } from './SkillInterface';
import { AppDatabase } from '../storage/database';
import { SheetsService } from '../sheets/sheetsService';
import { getAccessToken } from '../auth/firebaseAuth';

export class TaskSkill implements AssistantSkill {
  public readonly id = 'task_skill';
  public readonly name = 'Task & Reminder Engine';
  public readonly description = 'Creates, schedules, tracks to-do items, and optionally syncs them to Google Sheets.';
  public readonly permissions = ['NOTIFICATIONS'];
  public readonly requiresConfirmation = false;

  public async execute(params: Record<string, any>): Promise<SkillResult> {
    const action = params.action || 'list';

    if (action === 'create') {
      const title = params.title || params.query || 'Follow up with Shreya';
      const cleanTitle = title.replace(/^(remind me to|add task|create task|todo)\s+/i, '');

      const newTask = AppDatabase.addTask({
        title: cleanTitle,
        description: params.description || 'Created via assistant voice command',
        completed: false,
        priority: params.priority || 'medium',
        dueDate: params.dueDate || new Date().toISOString().split('T')[0],
        syncedToSheets: false,
      });

      // Optionally sync to active Google Sheet if authenticated
      let sheetsSyncMessage = '';
      const settings = AppDatabase.getSettings();
      const token = await getAccessToken();

      if (token && settings.activeSpreadsheetId) {
        try {
          await SheetsService.appendRow(settings.activeSpreadsheetId, 'Sheet1', [
            new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            'Task Created',
            cleanTitle,
            'Pending',
            'Synced from TaskSkill',
          ]);
          newTask.syncedToSheets = true;
          AppDatabase.updateTask(newTask.id, { syncedToSheets: true });
          sheetsSyncMessage = ' (Synced to Google Sheets)';
        } catch (e) {
          console.warn('Could not auto-sync task to Google Sheet:', e);
        }
      }

      return {
        success: true,
        summary: `Created task: "${cleanTitle}"${sheetsSyncMessage}`,
        data: newTask,
      };
    }

    if (action === 'list') {
      const tasks = AppDatabase.getTasks();
      const pending = tasks.filter((t) => !t.completed);
      return {
        success: true,
        summary: `You have ${pending.length} pending task(s).`,
        data: tasks,
      };
    }

    return {
      success: true,
      summary: 'Task operation processed.',
    };
  }
}
