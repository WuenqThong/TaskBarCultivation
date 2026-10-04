export enum BossSkillType {
    HEAVY_ATTACK = "heavy_attack",
    SELF_BUFF = "self_buff",
    SUMMON = "summon",
}

export interface BossSkillDefinition {
    id: string;
    name: string;
    type: BossSkillType;
    cooldown: number;
    initialCooldown?: number;
    damageMultiplier?: number;
    enabledFromPhase?: string;
    priority?: number;
    buffAttackMultiplier?: number;
    buffDuration?: number;
}

export interface BossSkillState {
    skillId: string;
    remainingCooldown: number;
}
