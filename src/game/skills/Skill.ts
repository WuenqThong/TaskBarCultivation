export enum SkillTargetType {
    SINGLE_ENEMY = "single_enemy",
    ALL_ENEMIES = "all_enemies",
    SELF = "self",
}

export enum SkillEffectType {
    DAMAGE = "damage",
    HEAL = "heal",
}

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    mpCost: number;
    baseCooldown: number;
    targetType: SkillTargetType;
    effectType: SkillEffectType;
    damageMultiplier?: number;
    healPercent?: number;
}
