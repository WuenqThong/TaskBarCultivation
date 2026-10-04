export interface SkillState {
    skillId: string;
    unlocked: boolean;
    level: number;
    remainingCooldown: number;
    autoCastEnabled: boolean;
}
