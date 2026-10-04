export enum EquipmentRarity {
    WHITE = "white",
    GREEN = "green",
    BLUE = "blue",
    PURPLE = "purple",
    GOLD = "gold",
    RED = "red",
}

export const EQUIPMENT_RARITY_LABELS: Readonly<
    Record<EquipmentRarity, string>
> = {
    [EquipmentRarity.WHITE]: "Trắng",
    [EquipmentRarity.GREEN]: "Xanh Lục",
    [EquipmentRarity.BLUE]: "Xanh Lam",
    [EquipmentRarity.PURPLE]: "Tím",
    [EquipmentRarity.GOLD]: "Vàng",
    [EquipmentRarity.RED]: "Đỏ",
};

export const EQUIPMENT_RARITY_COLORS: Readonly<
    Record<EquipmentRarity, string>
> = {
    [EquipmentRarity.WHITE]: "#FFFFFF",
    [EquipmentRarity.GREEN]: "#4ADE80",
    [EquipmentRarity.BLUE]: "#60A5FA",
    [EquipmentRarity.PURPLE]: "#C084FC",
    [EquipmentRarity.GOLD]: "#FACC15",
    [EquipmentRarity.RED]: "#EF4444",
};

const EQUIPMENT_RARITY_RANKS: Readonly<
    Record<EquipmentRarity, number>
> = {
    [EquipmentRarity.WHITE]: 1,
    [EquipmentRarity.GREEN]: 2,
    [EquipmentRarity.BLUE]: 3,
    [EquipmentRarity.PURPLE]: 4,
    [EquipmentRarity.GOLD]: 5,
    [EquipmentRarity.RED]: 6,
};

export function getEquipmentRarityRank(
    rarity: EquipmentRarity,
): number {
    return EQUIPMENT_RARITY_RANKS[rarity];
}
