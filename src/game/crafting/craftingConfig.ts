import { EquipmentRarity } from "../equipment/EquipmentRarity";

export const BASE_CRAFTING_RARITY_WEIGHTS: Readonly<
    Record<EquipmentRarity, number>
> = {
    [EquipmentRarity.WHITE]: 55,
    [EquipmentRarity.GREEN]: 28,
    [EquipmentRarity.BLUE]: 12,
    [EquipmentRarity.PURPLE]: 4,
    [EquipmentRarity.GOLD]: 0.9,
    [EquipmentRarity.RED]: 0.1,
};

// Exponential factors tilt the distribution without directly adding chance.
export const RARITY_LUCK_WEIGHT_FACTORS: Readonly<
    Record<EquipmentRarity, number>
> = {
    [EquipmentRarity.WHITE]: -0.01,
    [EquipmentRarity.GREEN]: -0.005,
    [EquipmentRarity.BLUE]: 0.005,
    [EquipmentRarity.PURPLE]: 0.012,
    [EquipmentRarity.GOLD]: 0.02,
    [EquipmentRarity.RED]: 0.03,
};
