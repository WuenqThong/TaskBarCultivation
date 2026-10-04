import type { CultivationRealm } from "../cultivation/CultivationRealm";
import type { CraftingType } from "./CraftingType";

export interface RecipeMaterialRequirement {
    itemId: string;
    quantity: number;
}

export interface CraftingRecipe {
    id: string;
    name: string;
    description: string;
    type: CraftingType;
    materials: ReadonlyArray<RecipeMaterialRequirement>;
    spiritStoneCost: number;
    requiredRealm?: CultivationRealm;
    outputId: string;
    outputQuantity?: number;
}
