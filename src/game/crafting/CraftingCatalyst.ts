import type { ItemDefinition } from "../items/Item";
import { ItemType } from "../items/Item";

export enum CraftingCatalystType {
    EQUIPMENT = "equipment",
    ALCHEMY = "alchemy",
    UNIVERSAL = "universal",
}

export interface CraftingCatalystDefinition extends ItemDefinition {
    type: ItemType.CATALYST;
    catalystType: CraftingCatalystType;
    rarityLuckBonus: number;
}

export const CRAFTING_CATALYST_TYPE_LABELS: Readonly<
    Record<CraftingCatalystType, string>
> = {
    [CraftingCatalystType.EQUIPMENT]: "Luyện Khí",
    [CraftingCatalystType.ALCHEMY]: "Luyện Đan",
    [CraftingCatalystType.UNIVERSAL]: "Dùng Chung",
};

export function isCraftingCatalyst(
    item: ItemDefinition,
): item is CraftingCatalystDefinition {
    return item.type === ItemType.CATALYST;
}
