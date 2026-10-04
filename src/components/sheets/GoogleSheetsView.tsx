import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Table,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Send,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { SheetsService } from '../../services/sheets/sheetsService';
import { googleSignIn, logoutGoogle } from '../../services/auth/firebaseAuth';
import { AppDatabase } from '../../services/storage/database';
import { GoogleSpreadsheetMetadata, SheetValueRange } from '../../types/sheets';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface GoogleSheetsViewProps {
  user: any;
  token: string | null;
  onRefreshAuth: () => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  user,
  token,
  onRefreshAuth,
}) => {
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [activeSheet, setActiveSheet] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [sheetData, setSheetData] = useState<SheetValueRange | null>(null);
  const [rangeInput, setRangeInput] = useState('Sheet1!A1:F20');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New sheet creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('SHREYA Assistant Activity Log');

  // Append row state
  const [rowCategory, setRowCategory] = useState('Assistant Voice Note');
  const [rowDetails, setRowDetails] = useState('');
  const [rowStatus, setRowStatus] = useState('Completed');

  // Confirmation modal state for destructive clear operation
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    const settings = AppDatabase.getSettings();
    if (settings.activeSpreadsheetId) {
      setSpreadsheetIdInput(settings.activeSpreadsheetId);
      if (token) {
        fetchSheetMetadata(settings.activeSpreadsheetId);
      }
    }
  }, [token]);

  const fetchSheetMetadata = async (id: string) => {
    if (!id.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const meta = await SheetsService.getSpreadsheet(id.trim());
      setActiveSheet(meta);
      const settings = AppDatabase.getSettings();
      AppDatabase.saveSettings({
        ...settings,
        activeSpreadsheetId: meta.spreadsheetId,
        activeSpreadsheetTitle: meta.properties.title,
      });
      // Also load values for the first tab
      await loadRangeData(meta.spreadsheetId, rangeInput);
      setStatusMessage({ text: `Connected to "${meta.properties.title}"`, type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Failed to load spreadsheet', type: 'error' });
      setActiveSheet(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRangeData = async (id: string, range: string) => {
    setIsLoading(true);
    try {
      const data = await SheetsService.readRange(id, range);
      setSheetData(data);
    } catch (e: any) {
      setStatusMessage({ text: `Could not read range: ${e.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!newSheetTitle.trim()) return;
    setIsLoading(true);
    try {
      const headers = ['Timestamp', 'Category', 'Description / Voice Transcript', 'Status', 'Logged By'];
      const meta = await SheetsService.createSpreadsheet(newSheetTitle.trim(), headers);
      setActiveSheet(meta);
      setSpreadsheetIdInput(meta.spreadsheetId);
      setShowCreateModal(false);
      setStatusMessage({ text: `Successfully created "${meta.properties.title}"!`, type: 'success' });
      await loadRangeData(meta.spreadsheetId, 'Sheet1!A1:E10');
    } catch (e: any) {
      setStatusMessage({ text: `Failed to create sheet: ${e.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppendRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSheet || !rowDetails.trim()) return;
    setIsLoading(true);
    try {
      const rowValues = [
        new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        rowCategory,
        rowDetails.trim(),
        rowStatus,
        'SHREYA AI Voice Core',
      ];
      await SheetsService.appendRow(activeSheet.spreadsheetId, 'Sheet1', rowValues);
      setRowDetails('');
      setStatusMessage({ text: 'Row successfully appended to Google Sheet!', type: 'success' });
      await loadRangeData(activeSheet.spreadsheetId, rangeInput);
    } catch (e: any) {
      setStatusMessage({ text: `Append failed: ${e.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const executeClearRange = async () => {
    if (!activeSheet) return;
    setIsLoading(true);
    setConfirmClearOpen(false);
    try {
      await SheetsService.clearRange(activeSheet.spreadsheetId, rangeInput);
      setStatusMessage({ text: `Cleared range ${rangeInput} in sheet.`, type: 'info' });
      await loadRangeData(activeSheet.spreadsheetId, rangeInput);
    } catch (e: any) {
      setStatusMessage({ text: `Clear failed: ${e.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await googleSignIn();
      onRefreshAuth();
      setStatusMessage({ text: 'Signed in with Google successfully!', type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Google sign-in failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    onRefreshAuth();
    setActiveSheet(null);
    setSheetData(null);
    setStatusMessage({ text: 'Signed out from Google Workspace.', type: 'info' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-neutral-900 border border-emerald-800/40 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Workspace Integration</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100">
              Google Sheets Studio
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Connect your Google account to empower SHREYA with real-time spreadsheet logging, table queries, and voice-automated records.
            </p>
          </div>

          {/* Auth State Button */}
          <div>
            {!token ? (
              <button
                onClick={handleGoogleSignInClick}
                disabled={isLoading}
                className="gsi-material-button flex items-center gap-3 bg-white text-neutral-900 font-medium px-5 py-2.5 rounded-xl shadow-lg hover:bg-neutral-100 transition-all cursor-pointer font-sans text-sm active:scale-95"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>Sign in with Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-700/80 p-2 pl-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full border border-neutral-600"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {user?.email?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-200 leading-tight">
                      {user?.displayName || 'Google Account'}
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-tight truncate max-w-[140px]">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors ml-1"
                  title="Sign out from Google Workspace"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Spreadsheet Controller */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Connection & Setup */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm text-neutral-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              Active Spreadsheet
            </h2>

            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Spreadsheet ID or URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  placeholder="Paste Spreadsheet ID..."
                  disabled={!token}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
                />
                <button
                  onClick={() => fetchSheetMetadata(spreadsheetIdInput)}
                  disabled={!token || isLoading}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!token}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Sheet</span>
              </button>
            </div>

            {activeSheet && (
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 truncate">
                    {activeSheet.properties.title}
                  </span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${activeSheet.spreadsheetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    <span>Open in Web</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  ID: {activeSheet.spreadsheetId}
                </p>
                <div className="text-[11px] text-neutral-400 flex gap-2">
                  <span>Sheets: {activeSheet.sheets.length}</span>
                  <span>•</span>
                  <span>Primary Tab: {activeSheet.sheets[0]?.properties.title || 'Sheet1'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Append Row Quick Action */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm text-neutral-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Append Row to Sheet
            </h2>
            <form onSubmit={handleAppendRow} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Category / Tag</label>
                <input
                  type="text"
                  value={rowCategory}
                  onChange={(e) => setRowCategory(e.target.value)}
                  disabled={!activeSheet}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Row Content / Log</label>
                <textarea
                  value={rowDetails}
                  onChange={(e) => setRowDetails(e.target.value)}
                  placeholder="e.g. Discussed roadmap with team, status updated..."
                  rows={2}
                  disabled={!activeSheet}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Status</label>
                <select
                  value={rowStatus}
                  onChange={(e) => setRowStatus(e.target.value)}
                  disabled={!activeSheet}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!activeSheet || !rowDetails.trim() || isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Append Row Now</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Table Data Preview & Range Viewer */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-neutral-200">Live Sheet Data Viewer</h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="Range (e.g. Sheet1!A1:E20)"
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono w-36"
                />
                <button
                  onClick={() => activeSheet && loadRangeData(activeSheet.spreadsheetId, rangeInput)}
                  disabled={!activeSheet || isLoading}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  title="Reload Range"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>

                {/* Destructive Clear with Confirmation Modal */}
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={!activeSheet || isLoading}
                  className="px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                  title="Clear range data"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto border border-neutral-800 rounded-xl bg-neutral-950/70 p-2">
              {!activeSheet ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500 space-y-3">
                  <FileSpreadsheet className="w-12 h-12 text-neutral-700" />
                  <p className="text-sm font-medium text-neutral-400">
                    No Google Sheet Connected
                  </p>
                  <p className="text-xs max-w-sm">
                    Sign in with Google above and enter a Spreadsheet ID, or tap &ldquo;Create New Sheet&rdquo; to start logging with SHREYA.
                  </p>
                </div>
              ) : sheetData && sheetData.values && sheetData.values.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 font-mono text-[11px]">
                      <th className="p-2 w-10 text-neutral-600">#</th>
                      {sheetData.values[0].map((header, idx) => (
                        <th key={idx} className="p-2.5 font-semibold text-neutral-300">
                          {header || `Col ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {sheetData.values.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="p-2 font-mono text-[10px] text-neutral-600">{rowIdx + 1}</td>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-2.5 text-neutral-200">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-500 space-y-2">
                  <p className="text-xs">Range {rangeInput} contains no rows or is empty.</p>
                </div>
              )}
            </div>

            {/* Voice Command Examples */}
            <div className="pt-2 border-t border-neutral-800/80">
              <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                Hands-Free Voice Commands with Google Sheets:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  '“Shreya, create a new Google Sheet for my daily tasks”',
                  '“Add a row to my active sheet with priority urgent”',
                  '“Read the latest entries from my spreadsheet”',
                ].map((sample, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px]"
                  >
                    {sample}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Sheet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-100">
                Create New Google Spreadsheet
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Spreadsheet Name</label>
              <input
                type="text"
                value={newSheetTitle}
                onChange={(e) => setNewSheetTitle(e.target.value)}
                placeholder="e.g. SHREYA Voice Activity Log"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-neutral-500">
                Will automatically include standard headers: Timestamp, Category, Details, Status, Logged By.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewSheet}
                disabled={isLoading || !newSheetTitle.trim()}
                className="px-5 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create in Google Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Range (Mandatory User Confirmation for Destructive Action) */}
      <ConfirmationModal
        isOpen={confirmClearOpen}
        title="Clear Spreadsheet Range?"
        message={`Are you sure you want to permanently clear the data in range "${rangeInput}" of spreadsheet "${activeSheet?.properties.title || 'active'}"? This action cannot be undone.`}
        confirmText="Yes, Clear Data"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={executeClearRange}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
