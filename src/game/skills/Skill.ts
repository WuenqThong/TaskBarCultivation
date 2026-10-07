export enum SkillTargetType {
    SINGLE_ENEMY = "single_enemy",
    ALL_ENEMIES = "all_enemies",
    SELF = "self",
}

export enum SkillEffectType {
    DAMAGE = "damage",
    HEAL = "heal",
}

export type SkillVfxProfile =
    | "normal-slash"
    | "sword-qi"
    | "ten-thousand-swords"
    | "heal";

export interface SkillProgressionDefinition {
    maxLevel: number;
    upgradeCostBase: number;
    upgradeCostGrowth: number;
    damageMultiplierPerLevel?: number;
    healPercentPerLevel?: number;
    mpCostPerLevel?: number;
    cooldownPerLevel?: number;
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
    range?: number;
    castTime?: number;
    animation?: "slash" | "spell";
    icon?: string;
    vfxProfile?: SkillVfxProfile;
    progression: SkillProgressionDefinition;
}
