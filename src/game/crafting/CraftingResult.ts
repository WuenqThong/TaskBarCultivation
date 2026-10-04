import type { EquipmentRarity } from "../equipment/EquipmentRarity";

export type GameRarity = EquipmentRarity;

export enum CraftFailReason {
    RECIPE_NOT_FOUND = "recipe_not_found",
    MISSING_MATERIAL = "missing_material",
    NOT_ENOUGH_SPIRIT_STONE = "not_enough_spirit_stone",
    REALM_TOO_LOW = "realm_too_low",
    INVALID_CATALYST = "invalid_catalyst",
    INVALID_RECIPE_TYPE = "invalid_recipe_type",
    OUTPUT_NOT_FOUND = "output_not_found",
    OUTPUT_CREATION_FAILED = "output_creation_failed",
}

export interface MaterialProgress {
    itemId: string;
    required: number;
    owned: number;
    enough: boolean;
}

export interface CraftCheckResult {
    success: boolean;
    reason?: CraftFailReason;
    missingMaterials?: MaterialProgress[];
    missingSpiritStone?: number;
    realmRequirementMet: boolean;
    catalystValid: boolean;
}

export interface CraftingResult {
    success: boolean;
    recipeId: string;
    outputId?: string;
    rarity?: GameRarity;
    usedCatalystId?: string;
    failureReason?: CraftFailReason;
}
