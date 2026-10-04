import type { CraftingManager } from "../crafting/CraftingManager";
import type { CraftPreview } from "../crafting/CraftingPreview";
import type { CraftingRecipe } from "../crafting/CraftingRecipe";
import { CraftFailReason } from "../crafting/CraftingResult";
import { CraftingType } from "../crafting/CraftingType";
import type { EquipmentDefinition } from "../equipment/Equipment";
import type { EquipmentFactory } from "../equipment/EquipmentFactory";
import type { EquipmentInstance } from "../equipment/EquipmentInstance";
import type { Inventory } from "../inventory/Inventory";
import type { EquipmentCraftResult } from "./EquipmentCraftResult";

interface RefiningManagerOptions {
    craftingManager: CraftingManager;
    inventory: Inventory;
    equipmentDefinitions: ReadonlyArray<EquipmentDefinition>;
    equipmentFactory: EquipmentFactory;
}

export class RefiningManager {
    private craftingManager: CraftingManager;
    private inventory: Inventory;
    private equipmentDefinitions: Map<string, EquipmentDefinition>;
    private equipmentFactory: EquipmentFactory;

    constructor(options: RefiningManagerOptions) {
        this.craftingManager = options.craftingManager;
        this.inventory = options.inventory;
        this.equipmentDefinitions = new Map(
            options.equipmentDefinitions.map((definition) => [
                definition.id,
                definition,
            ]),
        );
        this.equipmentFactory = options.equipmentFactory;
    }

    public getEquipmentRecipes(): CraftingRecipe[] {
        return this.craftingManager.getRecipesByType(CraftingType.EQUIPMENT);
    }

    public getPreview(
        recipeId: string,
        catalystItemId?: string,
    ): CraftPreview | null {
        const recipe = this.craftingManager.getRecipe(recipeId);

        if (!recipe || recipe.type !== CraftingType.EQUIPMENT) {
            return null;
        }

        return this.craftingManager.getCraftPreview(recipeId, catalystItemId);
    }

    public getEquipmentDefinition(
        recipeId: string,
    ): EquipmentDefinition | null {
        const recipe = this.craftingManager.getRecipe(recipeId);

        if (!recipe || recipe.type !== CraftingType.EQUIPMENT) {
            return null;
        }

        return this.equipmentDefinitions.get(recipe.outputId) ?? null;
    }

    public craftEquipment(
        recipeId: string,
        catalystItemId?: string,
    ): EquipmentCraftResult {
        const recipe = this.craftingManager.getRecipe(recipeId);

        if (!recipe) {
            return this.failure(recipeId, CraftFailReason.RECIPE_NOT_FOUND);
        }

        if (recipe.type !== CraftingType.EQUIPMENT) {
            return this.failure(recipeId, CraftFailReason.INVALID_RECIPE_TYPE);
        }

        const definition = this.equipmentDefinitions.get(recipe.outputId);

        if (!definition) {
            return this.failure(recipeId, CraftFailReason.OUTPUT_NOT_FOUND);
        }

        const check = this.craftingManager.canCraft(recipeId, catalystItemId);

        if (!check.success) {
            return this.failure(
                recipeId,
                check.reason ?? CraftFailReason.MISSING_MATERIAL,
            );
        }

        const rarity = this.craftingManager.rollRarity(
            recipeId,
            catalystItemId,
        );

        if (!rarity) {
            return this.failure(recipeId, CraftFailReason.INVALID_CATALYST);
        }

        let equipment: EquipmentInstance;

        try {
            equipment = this.equipmentFactory.create(definition, rarity);
        } catch {
            return this.failure(recipeId, CraftFailReason.OUTPUT_CREATION_FAILED);
        }

        if (!this.inventory.addEquipmentInstance(equipment)) {
            return this.failure(recipeId, CraftFailReason.OUTPUT_CREATION_FAILED);
        }

        const transaction = this.craftingManager.commitCraft(
            recipeId,
            rarity,
            catalystItemId,
        );

        if (!transaction.success) {
            this.inventory.removeEquipmentInstance(equipment.instanceId);

            return this.failure(
                recipeId,
                transaction.failureReason ?? CraftFailReason.MISSING_MATERIAL,
            );
        }

        return {
            success: true,
            equipment,
            rarity,
            recipeId,
            usedCatalystId: catalystItemId,
        };
    }

    private failure(
        recipeId: string,
        failureReason: CraftFailReason,
    ): EquipmentCraftResult {
        return {
            success: false,
            recipeId,
            failureReason,
        };
    }
}
