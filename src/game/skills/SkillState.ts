export type SkillRuntimePhase = "ready" | "casting" | "active" | "cooldown";

export interface SkillState {
    skillId: string;
    unlocked: boolean;
    level: number;
    remainingCooldown: number;
    autoCastEnabled: boolean;
    phase: SkillRuntimePhase;
}
