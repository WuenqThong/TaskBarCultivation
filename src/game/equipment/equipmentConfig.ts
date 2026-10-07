import { CultivationRealm } from "../cultivation/CultivationRealm";
import { StatType } from "../stats/StatType";
import { EquipmentRarity } from "./EquipmentRarity";
import { EquipmentSlot } from "./EquipmentSlot";

export interface StatRollRange {
    min: number;
    max: number;
}

export const INITIAL_STAT_LINE_COUNT = 2;
export const CURRENT_MAX_STAT_LINE_COUNT = 3;

export const RARITY_STAT_MULTIPLIER: Readonly<
    Record<EquipmentRarity, number>
> = {
    [EquipmentRarity.WHITE]: 1,
    [EquipmentRarity.GREEN]: 1.2,
    [EquipmentRarity.BLUE]: 1.45,
    [EquipmentRarity.PURPLE]: 1.75,
    [EquipmentRarity.GOLD]: 2.1,
    [EquipmentRarity.RED]: 2.6,
};

export const REALM_STAT_MULTIPLIER: Readonly<
    Record<CultivationRealm, number>
> = {
    [CultivationRealm.QI_REFINING]: 1,
    [CultivationRealm.FOUNDATION_ESTABLISHMENT]: 1.5,
    [CultivationRealm.GOLDEN_CORE]: 2.2,
    [CultivationRealm.NASCENT_SOUL]: 3.2,
    [CultivationRealm.SOUL_TRANSFORMATION]: 4.5,
    [CultivationRealm.VOID_REFINING]: 6,
    [CultivationRealm.BODY_INTEGRATION]: 8,
    [CultivationRealm.MAHAYANA]: 11,
    [CultivationRealm.TRIBULATION]: 15,
};

export const BASE_STAT_ROLL_RANGES: Readonly<
    Partial<Record<StatType, StatRollRange>>
> = {
    [StatType.ATTACK]: { min: 5, max: 10 },
    [StatType.DEFENSE]: { min: 2, max: 5 },
    [StatType.MAX_HP]: { min: 15, max: 30 },
    [StatType.MAX_MP]: { min: 8, max: 18 },
    [StatType.CRIT_RATE]: { min: 0.01, max: 0.03 },
    [StatType.CRIT_DAMAGE]: { min: 0.05, max: 0.15 },
    [StatType.CULTIVATION_SPEED]: { min: 0.03, max: 0.08 },
    [StatType.SKILL_COOLDOWN_RECOVERY]: { min: 0.02, max: 0.06 },
    [StatType.HP_REGEN]: { min: 0.5, max: 1.5 },
    [StatType.MP_REGEN]: { min: 0.4, max: 1.2 },
};

export const SLOT_STAT_POOLS: Readonly<
    Record<EquipmentSlot, ReadonlyArray<StatType>>
> = {
    [EquipmentSlot.WEAPON]: [
        StatType.ATTACK,
        StatType.CRIT_RATE,
        StatType.CRIT_DAMAGE,
    ],
    [EquipmentSlot.ARMOR]: [
        StatType.DEFENSE,
        StatType.MAX_HP,
        StatType.HP_REGEN,
    ],
    [EquipmentSlot.BRACELET]: [
        StatType.CRIT_RATE,
        StatType.CRIT_DAMAGE,
        StatType.MAX_MP,
        StatType.MP_REGEN,
        StatType.CULTIVATION_SPEED,
        StatType.SKILL_COOLDOWN_RECOVERY,
    ],
};
