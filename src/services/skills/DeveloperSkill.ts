import { AssistantSkill, SkillResult } from './SkillInterface';
import { DiagnosticManager } from '../diagnostics/DiagnosticManager';

export class DeveloperSkill implements AssistantSkill {
  public readonly id = 'developer_skill';
  public readonly name = 'Developer & Diagnostics Console';
  public readonly description = 'Runs system self-tests, network latency checks, and prints diagnostic health reports.';
  public readonly permissions = ['SYSTEM_DIAGNOSTICS'];
  public readonly requiresConfirmation = false;

  public async execute(): Promise<SkillResult> {
    const results = await DiagnosticManager.runFullDiagnostics();
    const passed = results.filter((r) => r.status === 'PASS').length;
    const errors = results.filter((r) => r.status === 'ERROR').length;

    return {
      success: errors === 0,
      summary: `System Diagnostics: ${passed} passed, ${results.length - passed - errors} warnings, ${errors} errors.`,
      data: results,
      requiresUIAction: 'NAVIGATE_DEVELOPER',
    };
  }
}
