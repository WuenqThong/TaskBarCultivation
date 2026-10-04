import type { EquipmentRarity } from "../equipment/EquipmentRarity";
import type { CraftingCatalystDefinition } from "./CraftingCatalyst";
import type { CraftingRecipe } from "./CraftingRecipe";
import type {
    CraftCheckResult,
    MaterialProgress,
} from "./CraftingResult";

export interface CraftPreview {
    recipe: CraftingRecipe;
    materials: MaterialProgress[];
    spiritStoneCost: number;
    realmRequirementMet: boolean;
    selectedCatalyst: CraftingCatalystDefinition | null;
    rarityLuck: number;
    rarityDistribution: Record<EquipmentRarity, number>;
    canCraft: boolean;
    check: CraftCheckResult;
}
