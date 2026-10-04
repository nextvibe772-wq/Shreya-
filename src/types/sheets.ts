export interface GoogleSpreadsheetMetadata {
  spreadsheetId: string;
  properties: {
    title: string;
    locale?: string;
    autoRecalc?: string;
    timeZone?: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index: number;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
  spreadsheetUrl?: string;
}

export interface SheetValueRange {
  range: string;
  majorDimension: 'ROWS' | 'COLUMNS';
  values: string[][];
}

export interface SheetAppendResponse {
  spreadsheetId: string;
  tableRange: string;
  updates: {
    spreadsheetId: string;
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
  };
}
