import { getAccessToken } from '../auth/firebaseAuth';
import { GoogleSpreadsheetMetadata, SheetValueRange, SheetAppendResponse } from '../../types/sheets';

export class SheetsService {
  private static async getValidToken(): Promise<string> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Sheets access token not found. Please sign in with Google first.');
    }
    return token;
  }

  /**
   * Retrieves spreadsheet metadata and list of sheets
   */
  public static async getSpreadsheet(spreadsheetId: string): Promise<GoogleSpreadsheetMetadata> {
    const token = await this.getValidToken();
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch spreadsheet (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Creates a brand new Google Spreadsheet
   */
  public static async createSpreadsheet(
    title: string,
    initialHeaders?: string[]
  ): Promise<GoogleSpreadsheetMetadata> {
    const token = await this.getValidToken();
    const body: any = {
      properties: {
        title: title || 'SHREYA Assistant Log',
      },
    };

    if (initialHeaders && initialHeaders.length > 0) {
      body.sheets = [
        {
          properties: { title: 'Sheet1' },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: initialHeaders.map((header) => ({
                    userEnteredValue: { stringValue: header },
                  })),
                },
              ],
            },
          ],
        },
      ];
    }

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create spreadsheet (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Reads data from a specific range in a spreadsheet
   */
  public static async readRange(spreadsheetId: string, range: string): Promise<SheetValueRange> {
    const token = await this.getValidToken();
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to read range ${range} (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Appends rows of data to the end of a sheet
   */
  public static async appendRow(
    spreadsheetId: string,
    range: string,
    values: any[]
  ): Promise<SheetAppendResponse> {
    const token = await this.getValidToken();
    const cleanRange = range.includes('!') ? range : `${range}!A1`;
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(cleanRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: cleanRange,
          majorDimension: 'ROWS',
          values: [values],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to append row (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Clears a range (Destructive action - callers MUST seek user confirmation first)
   */
  public static async clearRange(spreadsheetId: string, range: string): Promise<{ clearedRange: string }> {
    const token = await this.getValidToken();
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to clear range ${range} (${res.status})`);
    }

    return await res.json();
  }
}
