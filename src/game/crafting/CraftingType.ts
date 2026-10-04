export enum CraftingType {
    EQUIPMENT = "equipment",
    ALCHEMY = "alchemy",
}

export const CRAFTING_TYPE_LABELS: Readonly<Record<CraftingType, string>> = {
    [CraftingType.EQUIPMENT]: "Luyện Khí",
    [CraftingType.ALCHEMY]: "Luyện Đan",
};
