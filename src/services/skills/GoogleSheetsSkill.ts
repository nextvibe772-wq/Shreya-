import { AssistantSkill, SkillResult } from './SkillInterface';
import { SheetsService } from '../sheets/sheetsService';
import { AppDatabase } from '../storage/database';
import { getAccessToken } from '../auth/firebaseAuth';

export class GoogleSheetsSkill implements AssistantSkill {
  public readonly id = 'google_sheets_skill';
  public readonly name = 'Google Sheets Integration';
  public readonly description = 'Reads, creates, appends rows, and manages Google Spreadsheets for notes, logs, and tasks.';
  public readonly permissions = ['https://www.googleapis.com/auth/spreadsheets'];
  public readonly requiresConfirmation = false; // Individual destructive clear operations require confirmation

  public async execute(params: Record<string, any>): Promise<SkillResult> {
    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        summary: 'Google Sheets access is not connected. Please sign in with Google.',
        requiresUIAction: 'OPEN_SHEETS_AUTH',
      };
    }

    const action = params.action || 'read';
    const settings = AppDatabase.getSettings();
    const activeSpreadsheetId = params.spreadsheetId || settings.activeSpreadsheetId;

    try {
      if (action === 'create') {
        const title = params.title || `SHREYA Assistant Log - ${new Date().toLocaleDateString()}`;
        const headers = params.headers || ['Timestamp', 'Type', 'Content', 'Status', 'Notes'];
        const created = await SheetsService.createSpreadsheet(title, headers);

        // Update settings with the new active spreadsheet
        AppDatabase.saveSettings({
          ...settings,
          activeSpreadsheetId: created.spreadsheetId,
          activeSpreadsheetTitle: title,
        });

        // Save reference into memory
        AppDatabase.addMemory({
          key: `Active Google Sheet: ${title}`,
          value: `ID: ${created.spreadsheetId} | URL: ${created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}`}`,
          category: 'sheets_ref',
        });

        return {
          success: true,
          summary: `Created new Google Spreadsheet: "${title}" (ID: ${created.spreadsheetId})`,
          data: created,
        };
      }

      if (action === 'append') {
        if (!activeSpreadsheetId) {
          // If no active sheet, auto-create one first
          const newSheet = await SheetsService.createSpreadsheet('SHREYA Assistant Activity', [
            'Timestamp',
            'Action',
            'Details',
            'Source',
          ]);
          AppDatabase.saveSettings({
            ...settings,
            activeSpreadsheetId: newSheet.spreadsheetId,
            activeSpreadsheetTitle: 'SHREYA Assistant Activity',
          });
          const rowValues = params.values || [
            new Date().toISOString(),
            'Voice Note',
            params.query || 'Activity logged by SHREYA',
            'Assistant Voice Command',
          ];
          const appendRes = await SheetsService.appendRow(newSheet.spreadsheetId, 'Sheet1', rowValues);
          return {
            success: true,
            summary: `Created new sheet and appended entry to "${newSheet.properties.title}".`,
            data: appendRes,
          };
        }

        const rowValues = params.values || [
          new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          params.type || 'Assistant Log',
          params.text || params.query || 'Logged via SHREYA Voice',
          'Completed',
        ];

        const res = await SheetsService.appendRow(activeSpreadsheetId, 'Sheet1', rowValues);
        return {
          success: true,
          summary: `Appended row to Google Sheet (Updated ${res.updates.updatedCells} cell(s)).`,
          data: res,
        };
      }

      if (action === 'read' || action === 'view') {
        if (!activeSpreadsheetId) {
          return {
            success: false,
            summary: 'No active Google Sheet selected. Please create or enter a Spreadsheet ID in the Sheets tab.',
            requiresUIAction: 'SELECT_SHEET',
          };
        }

        const range = params.range || 'Sheet1!A1:E20';
        const data = await SheetsService.readRange(activeSpreadsheetId, range);
        const rowCount = data.values ? data.values.length : 0;

        return {
          success: true,
          summary: `Read ${rowCount} row(s) from spreadsheet.`,
          data,
        };
      }

      return {
        success: false,
        summary: `Unknown Google Sheets action: ${action}`,
      };
    } catch (err: any) {
      return {
        success: false,
        summary: `Google Sheets error: ${err.message}`,
        error: err.message,
      };
    }
  }
}
