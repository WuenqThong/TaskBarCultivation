import type { CraftFailReason, GameRarity } from "../crafting/CraftingResult";

export interface PillCraftResult {
    success: boolean;
    recipeId: string;
    pillId?: string;
    rarity?: GameRarity;
    quantity?: number;
    usedCatalystId?: string;
    failureReason?: CraftFailReason;
}
