import { AssistantSkill, SkillResult } from './SkillInterface';
import { GoogleSheetsSkill } from './GoogleSheetsSkill';
import { SearchSkill } from './SearchSkill';
import { AppSkill } from './AppSkill';
import { SmartHomeSkill } from './SmartHomeSkill';
import { PCSkill } from './PCSkill';
import { BluetoothSkill } from './BluetoothSkill';
import { MediaSkill } from './MediaSkill';
import { TaskSkill } from './TaskSkill';
import { DeveloperSkill } from './DeveloperSkill';
import { CommandIntentType } from '../nlu/CommandClassifier';

export class SkillRouter {
  private static skills: Map<string, AssistantSkill> = new Map();

  public static initialize(): void {
    const list: AssistantSkill[] = [
      new GoogleSheetsSkill(),
      new SearchSkill(),
      new AppSkill(),
      new SmartHomeSkill(),
      new PCSkill(),
      new BluetoothSkill(),
      new MediaSkill(),
      new TaskSkill(),
      new DeveloperSkill(),
    ];

    list.forEach((skill) => {
      this.skills.set(skill.id, skill);
    });
  }

  public static getSkills(): AssistantSkill[] {
    if (this.skills.size === 0) this.initialize();
    return Array.from(this.skills.values());
  }

  public static getSkillById(id: string): AssistantSkill | undefined {
    if (this.skills.size === 0) this.initialize();
    return this.skills.get(id);
  }

  public static async route(
    intent: CommandIntentType,
    params: Record<string, any>
  ): Promise<SkillResult | null> {
    if (this.skills.size === 0) this.initialize();

    let targetSkillId: string | null = null;

    switch (intent) {
      case 'GOOGLE_SHEETS':
        targetSkillId = 'google_sheets_skill';
        break;
      case 'SEARCH':
        targetSkillId = 'search_skill';
        break;
      case 'OPEN_APP':
        targetSkillId = 'app_skill';
        break;
      case 'SMART_HOME':
        targetSkillId = 'smarthome_skill';
        break;
      case 'PC':
        targetSkillId = 'pc_skill';
        break;
      case 'BLUETOOTH':
        targetSkillId = 'bluetooth_skill';
        break;
      case 'MEDIA':
        targetSkillId = 'media_skill';
        break;
      case 'TASK':
        targetSkillId = 'task_skill';
        break;
      case 'DEVELOPER':
        targetSkillId = 'developer_skill';
        break;
      default:
        targetSkillId = null;
    }

    if (!targetSkillId) return null;

    const skill = this.skills.get(targetSkillId);
    if (!skill) return null;

    try {
      return await skill.execute(params);
    } catch (err: any) {
      return {
        success: false,
        summary: `Skill ${skill.name} failed: ${err.message}`,
        error: err.message,
      };
    }
  }
}
