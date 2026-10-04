import type { CraftFailReason } from "../crafting/CraftingResult";
import type { EquipmentInstance } from "../equipment/EquipmentInstance";
import type { EquipmentRarity } from "../equipment/EquipmentRarity";

export interface EquipmentCraftResult {
    success: boolean;
    equipment?: EquipmentInstance;
    rarity?: EquipmentRarity;
    recipeId: string;
    usedCatalystId?: string;
    failureReason?: CraftFailReason;
}
