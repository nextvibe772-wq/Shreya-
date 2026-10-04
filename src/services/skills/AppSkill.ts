import { AssistantSkill, SkillResult } from './SkillInterface';

export class AppSkill implements AssistantSkill {
  public readonly id = 'app_skill';
  public readonly name = 'App & Intent Launcher';
  public readonly description = 'Launches native applications, deep links, web services, dialers, and settings.';
  public readonly permissions = ['LAUNCH_INTENT'];
  public readonly requiresConfirmation = false;

  private appMap: Record<string, string> = {
    youtube: 'https://youtube.com',
    google: 'https://google.com',
    maps: 'https://maps.google.com',
    gmail: 'https://mail.google.com',
    calendar: 'https://calendar.google.com',
    whatsapp: 'https://web.whatsapp.com',
    spotify: 'https://open.spotify.com',
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    settings: '#settings',
  };

  public async execute(params: Record<string, any>): Promise<SkillResult> {
    const rawName = (params.appName || '').toLowerCase().trim();
    let targetUrl = this.appMap[rawName];

    if (!targetUrl) {
      if (rawName.startsWith('http://') || rawName.startsWith('https://')) {
        targetUrl = rawName;
      } else {
        // Fallback to opening search or web portal
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(rawName)}`;
      }
    }

    if (targetUrl.startsWith('#')) {
      return {
        success: true,
        summary: `Navigating to internal section: ${rawName}`,
        requiresUIAction: 'NAVIGATE_SETTINGS',
      };
    }

    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        summary: `Launched ${rawName || 'app'} (${targetUrl})`,
        data: { targetUrl },
      };
    } catch (e: any) {
      return {
        success: false,
        summary: `Could not open app: ${e.message}`,
      };
    }
  }
}
