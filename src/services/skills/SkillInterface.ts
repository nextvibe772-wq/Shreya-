export interface SkillResult {
  success: boolean;
  summary: string;
  data?: any;
  error?: string;
  requiresUIAction?: string;
}

export interface AssistantSkill {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  requiresConfirmation: boolean;
  execute(params: Record<string, any>): Promise<SkillResult>;
}
