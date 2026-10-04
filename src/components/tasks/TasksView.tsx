import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Table,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { TaskItem } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { SheetsService } from '../../services/sheets/sheetsService';
import { getAccessToken } from '../../services/auth/firebaseAuth';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => AppDatabase.getTasks());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    AppDatabase.addTask({
      title: newTaskTitle.trim(),
      completed: false,
      priority: newPriority,
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      syncedToSheets: false,
    });

    setTasks(AppDatabase.getTasks());
    setNewTaskTitle('');
    setNewDueDate('');
  };

  const handleToggleTask = (task: TaskItem) => {
    AppDatabase.updateTask(task.id, { completed: !task.completed });
    setTasks(AppDatabase.getTasks());
  };

  const handleDeleteTask = (id: string) => {
    AppDatabase.deleteTask(id);
    setTasks(AppDatabase.getTasks());
  };

  const handleSyncToSheets = async () => {
    const settings = AppDatabase.getSettings();
    const token = await getAccessToken();

    if (!token) {
      setStatusMessage('Please sign in with Google in the Sheets tab first.');
      return;
    }
    if (!settings.activeSpreadsheetId) {
      setStatusMessage('No active Google Sheet selected in Google Sheets Studio.');
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);

    try {
      let count = 0;
      for (const t of tasks.filter((task) => !task.completed)) {
        await SheetsService.appendRow(settings.activeSpreadsheetId, 'Sheet1', [
          new Date().toLocaleDateString(),
          'Task',
          t.title,
          t.priority.toUpperCase(),
          'Synced from SHREYA Tasks',
        ]);
        AppDatabase.updateTask(t.id, { syncedToSheets: true });
        count++;
      }
      setTasks(AppDatabase.getTasks());
      setStatusMessage(`Successfully synced ${count} task(s) to Google Sheets!`);
    } catch (e: any) {
      setStatusMessage(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-neutral-900 border border-emerald-800/40 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <CheckSquare className="w-4 h-4" />
            <span>Task Engine & Scheduler</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
            Tasks & Reminders
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-1">
            Track to-do items and sync schedules directly to your active Google Spreadsheet.
          </p>
        </div>

        <button
          onClick={handleSyncToSheets}
          disabled={isSyncing || tasks.length === 0}
          className="px-4 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Table className="w-4 h-4" />
          <span>{isSyncing ? 'Syncing...' : 'Sync to Google Sheets'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-neutral-900 border border-emerald-800/80 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Add Task Input Bar */}
      <form
        onSubmit={handleAddTask}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-lg"
      >
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task (e.g. Prepare presentation, Submit invoice)..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-xs text-neutral-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 border border-neutral-800/80 rounded-2xl bg-neutral-900/40">
            <CheckSquare className="w-8 h-8 mx-auto text-neutral-700 mb-2" />
            <p className="text-sm font-medium text-neutral-400">All Tasks Cleared</p>
            <p className="text-xs">Say &ldquo;Shreya, remind me to check emails at 4 PM&rdquo; to add tasks via voice.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                task.completed
                  ? 'bg-neutral-900/40 border-neutral-800/50 opacity-60'
                  : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-neutral-950 border-neutral-700 cursor-pointer"
                />
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                    }`}
                  >
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                    )}
                    {task.syncedToSheets && (
                      <span className="text-emerald-400 font-medium">Sheets Synced ✓</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                    task.priority === 'high'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : task.priority === 'medium'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
