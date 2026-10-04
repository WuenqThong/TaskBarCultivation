import { EquipmentRarity } from "./EquipmentRarity";

export const EQUIPMENT_SALVAGE_ESSENCE_BY_RARITY: Readonly<
    Record<EquipmentRarity, number>
> = {
    [EquipmentRarity.WHITE]: 1,
    [EquipmentRarity.GREEN]: 2,
    [EquipmentRarity.BLUE]: 4,
    [EquipmentRarity.PURPLE]: 8,
    [EquipmentRarity.GOLD]: 16,
    [EquipmentRarity.RED]: 32,
};
