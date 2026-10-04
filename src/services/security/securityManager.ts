export interface AuditLogEntry {
  id: string;
  action: string;
  target: string;
  timestamp: number;
  approved: boolean;
}

export class SecurityManager {
  private static readonly STORAGE_PREFIX = 'shreya_sec_';
  private static readonly KEY_SALT = 'shreya_keystore_v1_secure_node';
  private static auditLogs: AuditLogEntry[] = [];

  /**
   * Obfuscates and encrypts a secret value before storing
   */
  public static storeSecret(key: string, secret: string): void {
    if (!secret) {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
      return;
    }
    try {
      // XOR and base64 representation to prevent plaintext storage in browser storage
      const encoded = this.xorCipher(secret, this.KEY_SALT);
      localStorage.setItem(this.STORAGE_PREFIX + key, btoa(encoded));
    } catch (e) {
      console.error('Failed to securely store key');
    }
  }

  /**
   * Decrypts and retrieves a stored secret
   */
  public static getSecret(key: string): string {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (!stored) return '';
      const decoded = atob(stored);
      return this.xorCipher(decoded, this.KEY_SALT);
    } catch {
      return '';
    }
  }

  /**
   * Masks sensitive keys for display in the UI (e.g. gsk_1234...wxyz)
   */
  public static maskKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  /**
   * Logs a security audit event
   */
  public static recordAudit(action: string, target: string, approved: boolean): void {
    this.auditLogs.unshift({
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      action,
      target,
      timestamp: Date.now(),
      approved,
    });
    if (this.auditLogs.length > 100) this.auditLogs.pop();
  }

  public static getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  private static xorCipher(text: string, salt: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return result;
  }
}
