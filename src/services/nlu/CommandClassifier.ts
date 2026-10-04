export type CommandIntentType =
  | 'CHAT'
  | 'SEARCH'
  | 'GOOGLE_SHEETS'
  | 'OPEN_APP'
  | 'FILE'
  | 'MEDIA'
  | 'PHONE'
  | 'BLUETOOTH'
  | 'PC'
  | 'SMART_HOME'
  | 'TASK'
  | 'MEMORY'
  | 'SETTINGS'
  | 'DEVELOPER';

export interface ClassifiedCommand {
  intent: CommandIntentType;
  confidence: number;
  extractedParams: Record<string, any>;
  rawQuery: string;
}

export class CommandClassifier {
  public static classify(input: string): ClassifiedCommand {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Google Sheets commands
    if (
      lower.includes('sheet') ||
      lower.includes('spreadsheet') ||
      lower.includes('google sheet') ||
      lower.includes('शीट') ||
      lower.includes('row') ||
      lower.includes('append to sheet')
    ) {
      let action = 'view';
      if (lower.includes('create') || lower.includes('new') || lower.includes('बनाओ')) action = 'create';
      if (lower.includes('add') || lower.includes('append') || lower.includes('जोड़ो') || lower.includes('log to sheet')) action = 'append';
      if (lower.includes('read') || lower.includes('get') || lower.includes('fetch') || lower.includes('दिखाओ')) action = 'read';
      if (lower.includes('clear') || lower.includes('delete') || lower.includes('हटाओ')) action = 'clear';

      return {
        intent: 'GOOGLE_SHEETS',
        confidence: 0.95,
        extractedParams: { action, query: text },
        rawQuery: text,
      };
    }

    // 2. Tasks & Reminders
    if (
      lower.startsWith('remind me') ||
      lower.includes('reminder') ||
      lower.includes('task') ||
      lower.includes('to-do') ||
      lower.includes('todo') ||
      lower.includes('याद दिलाना') ||
      lower.includes('काम')
    ) {
      const isCreate = lower.includes('remind') || lower.includes('add') || lower.includes('create') || lower.includes('नया');
      return {
        intent: 'TASK',
        confidence: 0.92,
        extractedParams: { action: isCreate ? 'create' : 'list', query: text },
        rawQuery: text,
      };
    }

    // 3. Memory commands
    if (
      lower.startsWith('remember') ||
      lower.includes('remember that') ||
      lower.includes('my favorite') ||
      lower.includes('my name is') ||
      lower.includes('याद रखो') ||
      lower.includes('मेरी पसंद') ||
      lower.includes('what do you remember') ||
      lower.includes('forget that')
    ) {
      const isForget = lower.includes('forget') || lower.includes('भूल जाओ') || lower.includes('delete');
      return {
        intent: 'MEMORY',
        confidence: 0.93,
        extractedParams: { action: isForget ? 'delete' : 'save', query: text },
        rawQuery: text,
      };
    }

    // 4. Smart Home / ESP32 / Raspberry Pi
    if (
      lower.includes('light') ||
      lower.includes('relay') ||
      lower.includes('esp32') ||
      lower.includes('raspberry pi') ||
      lower.includes('temperature') ||
      lower.includes('fan') ||
      lower.includes('बत्ती') ||
      lower.includes('पंखा') ||
      lower.includes('कमरा') ||
      lower.includes('turn on') ||
      lower.includes('turn off')
    ) {
      const targetState = lower.includes('on') || lower.includes('chalu') || lower.includes('चालू');
      return {
        intent: 'SMART_HOME',
        confidence: 0.9,
        extractedParams: { state: targetState, query: text },
        rawQuery: text,
      };
    }

    // 5. PC Companion Mode
    if (
      lower.includes('pc') ||
      lower.includes('computer') ||
      lower.includes('laptop') ||
      lower.includes('workstation') ||
      lower.includes('desktop')
    ) {
      return {
        intent: 'PC',
        confidence: 0.88,
        extractedParams: { action: 'command', query: text },
        rawQuery: text,
      };
    }

    // 6. Bluetooth
    if (
      lower.includes('bluetooth') ||
      lower.includes('ble') ||
      lower.includes('pair device') ||
      lower.includes('connect to speaker') ||
      lower.includes('ब्लूटूथ')
    ) {
      return {
        intent: 'BLUETOOTH',
        confidence: 0.9,
        extractedParams: { action: 'scan', query: text },
        rawQuery: text,
      };
    }

    // 7. Media Control
    if (
      lower.includes('play music') ||
      lower.includes('pause music') ||
      lower.includes('stop audio') ||
      lower.includes('volume up') ||
      lower.includes('volume down') ||
      lower.includes('mute') ||
      lower.includes('गाना बजाओ') ||
      lower.includes('गाना रोको')
    ) {
      return {
        intent: 'MEDIA',
        confidence: 0.91,
        extractedParams: { action: lower.includes('pause') || lower.includes('stop') ? 'pause' : 'play' },
        rawQuery: text,
      };
    }

    // 8. Open App / Phone
    if (
      lower.startsWith('open ') ||
      lower.startsWith('launch ') ||
      lower.includes('खोलो') ||
      lower.includes('start app')
    ) {
      const appName = text.replace(/^(open|launch|start app)\s+/i, '').replace(/\s*(खोलो|चलाओ)\s*$/i, '');
      return {
        intent: 'OPEN_APP',
        confidence: 0.89,
        extractedParams: { appName },
        rawQuery: text,
      };
    }

    // 9. Files
    if (
      lower.includes('file') ||
      lower.includes('document') ||
      lower.includes('upload') ||
      lower.includes('फ़ाइल')
    ) {
      return {
        intent: 'FILE',
        confidence: 0.82,
        extractedParams: { action: 'browse' },
        rawQuery: text,
      };
    }

    // 10. Web Search
    if (
      lower.startsWith('search ') ||
      lower.startsWith('who is ') ||
      lower.startsWith('what is ') ||
      lower.startsWith('latest news') ||
      lower.startsWith('weather in') ||
      lower.includes('खोजो') ||
      lower.includes('मौसम') ||
      lower.includes('google for')
    ) {
      const query = text.replace(/^(search for|search|google for|google)\s+/i, '');
      return {
        intent: 'SEARCH',
        confidence: 0.85,
        extractedParams: { query },
        rawQuery: text,
      };
    }

    // 11. Developer / Diagnostics
    if (
      lower.includes('diagnostics') ||
      lower.includes('latency') ||
      lower.includes('test api') ||
      lower.includes('developer console') ||
      lower.includes('system health')
    ) {
      return {
        intent: 'DEVELOPER',
        confidence: 0.9,
        extractedParams: { action: 'run' },
        rawQuery: text,
      };
    }

    // Default to general chat
    return {
      intent: 'CHAT',
      confidence: 0.7,
      extractedParams: {},
      rawQuery: text,
    };
  }
}
