import React, { useState } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Download,
  Tag,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MemoryEntry, MemoryCategory } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>(() => AppDatabase.getMemories());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  // New Memory Form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('long_term');

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    AppDatabase.addMemory({
      key: newKey.trim(),
      value: newValue.trim(),
      category: newCategory,
      confidence: 1.0,
      source: 'manual_entry',
    });

    setMemories(AppDatabase.getMemories());
    setNewKey('');
    setNewValue('');
    setShowAddModal(false);
  };

  const executeDelete = () => {
    if (deleteTargetId) {
      AppDatabase.deleteMemory(deleteTargetId);
      setMemories(AppDatabase.getMemories());
      setDeleteTargetId(null);
    }
  };

  const executeClearAll = () => {
    AppDatabase.clearAllMemories();
    setMemories([]);
    setClearAllConfirm(false);
  };

  const exportMemoryJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shreya_memories_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-neutral-900 border border-purple-800/40 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs tracking-wider uppercase">
            <Database className="w-4 h-4" />
            <span>Continuous Personalization</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
            Memory Vault
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-1">
            SHREYA remembers user preferences, active spreadsheets, project facts, and custom parameters across sessions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
          <button
            onClick={exportMemoryJSON}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors cursor-pointer"
            title="Export Memories to JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recalled memories..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['all', 'preference', 'long_term', 'task', 'sheets_ref'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
          {memories.length > 0 && (
            <button
              onClick={() => setClearAllConfirm(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/40 transition-colors ml-auto cursor-pointer shrink-0"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-500 border border-neutral-800/80 rounded-2xl bg-neutral-900/40 space-y-2">
            <Database className="w-8 h-8 mx-auto text-neutral-700" />
            <p className="text-sm font-medium text-neutral-400">No Memories Found</p>
            <p className="text-xs">Say &ldquo;Remember that my preferred language is Hinglish&rdquo; to store facts.</p>
          </div>
        ) : (
          filteredMemories.map((entry) => (
            <div
              key={entry.id}
              className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-3 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-950 text-purple-400 border border-neutral-800">
                    {entry.category.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setDeleteTargetId(entry.id)}
                    className="text-neutral-600 hover:text-rose-400 p-1 transition-colors"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-semibold text-sm text-neutral-200">{entry.key}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{entry.value}</p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
                <span>Confidence: 100%</span>
                <span>{new Date(entry.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              <span>Record New Memory</span>
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Key / Topic</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. User Work Schedule, Favorite Project, Google Sheet Ref"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Value / Fact</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. Prefers standup updates at 9:30 AM in Hinglish"
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="preference">Preference</option>
                  <option value="long_term">Long-term Fact</option>
                  <option value="task">Task Memory</option>
                  <option value="sheets_ref">Sheets Reference</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50"
                >
                  Store Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals for Delete & Clear All */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Memory Entry?"
        message="Are you sure you want to delete this memory fact? SHREYA will no longer use it during reasoning."
        confirmText="Delete Fact"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmationModal
        isOpen={clearAllConfirm}
        title="Clear Entire Memory Vault?"
        message="This will permanently delete all stored personalization data and memory records. This action cannot be undone."
        confirmText="Wipe Everything"
        onConfirm={executeClearAll}
        onCancel={() => setClearAllConfirm(false)}
      />
    </div>
  );
};
