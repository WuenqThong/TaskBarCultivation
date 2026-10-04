import { EquipmentRarity } from "../equipment/EquipmentRarity";

export const PILL_RARITY_EFFECT_MULTIPLIER: Readonly<
    Record<EquipmentRarity, number>
> = {
    [EquipmentRarity.WHITE]: 1,
    [EquipmentRarity.GREEN]: 1.2,
    [EquipmentRarity.BLUE]: 1.5,
    [EquipmentRarity.PURPLE]: 2,
    [EquipmentRarity.GOLD]: 2.75,
    [EquipmentRarity.RED]: 4,
};
