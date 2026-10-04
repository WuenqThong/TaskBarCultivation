import type { CultivationRealm } from "../cultivation/CultivationRealm";
import type { GameRarity } from "../crafting/CraftingResult";

export enum PillEffectType {
    RESTORE_HP = "restore_hp",
    RESTORE_MP = "restore_mp",
    CULTIVATION_SPEED = "cultivation_speed",
}

export interface PillDefinition {
    id: string;
    name: string;
    description: string;
    effectType: PillEffectType;
    baseEffectValue: number;
    duration?: number;
    requiredRealm?: CultivationRealm;
}

export interface PillEffectPreview {
    definitionId: string;
    rarity: GameRarity;
    effectType: PillEffectType;
    effectValue: number;
    duration?: number;
}
