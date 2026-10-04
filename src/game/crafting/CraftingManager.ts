import {
    getCultivationRealmRank,
} from "../cultivation/CultivationRealm";
import type { CultivationRealm } from "../cultivation/CultivationRealm";
import type { EquipmentRarity } from "../equipment/EquipmentRarity";
import type { Inventory } from "../inventory/Inventory";
import type { ItemDefinition } from "../items/Item";
import {
    CraftingCatalystType,
} from "./CraftingCatalyst";
import type { CraftingCatalystDefinition } from "./CraftingCatalyst";
import type { CraftPreview } from "./CraftingPreview";
import type {
    CraftingRecipe,
    RecipeMaterialRequirement,
} from "./CraftingRecipe";
import {
    CraftFailReason,
} from "./CraftingResult";
import type {
    CraftCheckResult,
    CraftingResult,
    MaterialProgress,
} from "./CraftingResult";
import { CraftingType } from "./CraftingType";
import type { RarityDistribution } from "./RarityRoller";
import { RarityRoller } from "./RarityRoller";

interface CraftingManagerOptions {
    inventory: Inventory;
    recipes: ReadonlyArray<CraftingRecipe>;
    catalysts: ReadonlyArray<CraftingCatalystDefinition>;
    rarityRoller: RarityRoller;
    getSpiritStone: () => number;
    spendSpiritStone: (amount: number) => boolean;
    getRealm: () => CultivationRealm;
}

interface TransactionSnapshot {
    item: ItemDefinition;
    quantity: number;
}

export class CraftingManager {
    private inventory: Inventory;
    private recipes: Map<string, CraftingRecipe>;
    private catalysts: Map<string, CraftingCatalystDefinition>;
    private rarityRoller: RarityRoller;
    private getSpiritStone: () => number;
    private spendSpiritStone: (amount: number) => boolean;
    private getRealm: () => CultivationRealm;

    constructor(options: CraftingManagerOptions) {
        this.inventory = options.inventory;
        this.recipes = new Map(
            options.recipes.map((recipe) => [recipe.id, recipe]),
        );
        this.catalysts = new Map(
            options.catalysts.map((catalyst) => [catalyst.id, catalyst]),
        );
        this.rarityRoller = options.rarityRoller;
        this.getSpiritStone = options.getSpiritStone;
        this.spendSpiritStone = options.spendSpiritStone;
        this.getRealm = options.getRealm;
    }

    public getRecipe(recipeId: string): CraftingRecipe | null {
        const recipe = this.recipes.get(recipeId);

        return recipe ? this.cloneRecipe(recipe) : null;
    }

    public getRecipesByType(type: CraftingType): CraftingRecipe[] {
        return Array.from(this.recipes.values())
            .filter((recipe) => recipe.type === type)
            .map((recipe) => this.cloneRecipe(recipe));
    }

    public getMaterialProgress(recipeId: string): MaterialProgress[] {
        const recipe = this.recipes.get(recipeId);

        if (!recipe) {
            return [];
        }

        return recipe.materials.map((requirement) => {
            const owned = this.inventory.getQuantity(requirement.itemId);

            return {
                itemId: requirement.itemId,
                required: requirement.quantity,
                owned,
                enough: owned >= requirement.quantity,
            };
        });
    }

    public canCraft(
        recipeId: string,
        catalystItemId?: string,
    ): CraftCheckResult {
        const recipe = this.recipes.get(recipeId);

        if (!recipe) {
            return {
                success: false,
                reason: CraftFailReason.RECIPE_NOT_FOUND,
                realmRequirementMet: false,
                catalystValid: false,
            };
        }

        const materials = this.getMaterialProgress(recipeId);
        const missingMaterials = materials.filter((material) => !material.enough);
        const currentSpiritStone = this.getSpiritStone();
        const missingSpiritStone = Math.max(
            0,
            recipe.spiritStoneCost - currentSpiritStone,
        );
        const realmRequirementMet = !recipe.requiredRealm ||
            getCultivationRealmRank(this.getRealm()) >=
                getCultivationRealmRank(recipe.requiredRealm);
        const catalystValid = this.isCatalystSelectionValid(
            recipe,
            catalystItemId,
            true,
        );

        if (missingMaterials.length > 0) {
            return {
                success: false,
                reason: CraftFailReason.MISSING_MATERIAL,
                missingMaterials,
                realmRequirementMet,
                catalystValid,
            };
        }

        if (missingSpiritStone > 0) {
            return {
                success: false,
                reason: CraftFailReason.NOT_ENOUGH_SPIRIT_STONE,
                missingSpiritStone,
                realmRequirementMet,
                catalystValid,
            };
        }

        if (!realmRequirementMet) {
            return {
                success: false,
                reason: CraftFailReason.REALM_TOO_LOW,
                realmRequirementMet,
                catalystValid,
            };
        }

        if (!catalystValid) {
            return {
                success: false,
                reason: CraftFailReason.INVALID_CATALYST,
                realmRequirementMet,
                catalystValid,
            };
        }

        return {
            success: true,
            realmRequirementMet,
            catalystValid,
        };
    }

    public getRarityDistribution(
        recipeId: string,
        catalystItemId?: string,
    ): RarityDistribution | null {
        const recipe = this.recipes.get(recipeId);

        if (!recipe) {
            return null;
        }

        const catalyst = catalystItemId
            ? this.catalysts.get(catalystItemId) ?? null
            : null;

        if (
            catalystItemId &&
            (!catalyst || !this.isCatalystCompatible(recipe, catalyst))
        ) {
            return null;
        }

        return this.rarityRoller.getProbabilityDistribution(
            undefined,
            catalyst?.rarityLuckBonus ?? 0,
        );
    }

    public getCraftPreview(
        recipeId: string,
        catalystItemId?: string,
    ): CraftPreview | null {
        const recipe = this.recipes.get(recipeId);

        if (!recipe) {
            return null;
        }

        const selectedCatalyst = catalystItemId
            ? this.catalysts.get(catalystItemId) ?? null
            : null;
        const compatibleCatalyst = selectedCatalyst &&
            this.isCatalystCompatible(recipe, selectedCatalyst)
                ? selectedCatalyst
                : null;
        const check = this.canCraft(recipeId, catalystItemId);
        const rarityDistribution = this.rarityRoller
            .getProbabilityDistribution(
                undefined,
                compatibleCatalyst?.rarityLuckBonus ?? 0,
            );

        return {
            recipe: this.cloneRecipe(recipe),
            materials: this.getMaterialProgress(recipeId),
            spiritStoneCost: recipe.spiritStoneCost,
            realmRequirementMet: check.realmRequirementMet,
            selectedCatalyst,
            rarityLuck: compatibleCatalyst?.rarityLuckBonus ?? 0,
            rarityDistribution,
            canCraft: check.success,
            check,
        };
    }

    public getCompatibleCatalysts(
        recipeId: string,
        ownedOnly = true,
    ): CraftingCatalystDefinition[] {
        const recipe = this.recipes.get(recipeId);

        if (!recipe) {
            return [];
        }

        return Array.from(this.catalysts.values())
            .filter((catalyst) =>
                this.isCatalystCompatible(recipe, catalyst) &&
                (!ownedOnly || this.inventory.hasItem(catalyst.id, 1)),
            )
            .map((catalyst) => ({ ...catalyst }));
    }

    public rollRarity(
        recipeId: string,
        catalystItemId?: string,
    ): EquipmentRarity | null {
        const recipe = this.recipes.get(recipeId);

        if (
            !recipe ||
            !this.isCatalystSelectionValid(recipe, catalystItemId, true)
        ) {
            return null;
        }

        const catalyst = catalystItemId
            ? this.catalysts.get(catalystItemId) ?? null
            : null;

        return this.rarityRoller.roll(catalyst?.rarityLuckBonus ?? 0);
    }

    public craft(
        recipeId: string,
        catalystItemId?: string,
    ): CraftingResult {
        const rarity = this.rollRarity(recipeId, catalystItemId);

        if (!rarity) {
            const check = this.canCraft(recipeId, catalystItemId);

            return {
                success: false,
                recipeId,
                failureReason: check.reason ?? CraftFailReason.INVALID_CATALYST,
            };
        }

        return this.commitCraft(recipeId, rarity, catalystItemId);
    }

    public commitCraft(
        recipeId: string,
        rarity: EquipmentRarity,
        catalystItemId?: string,
    ): CraftingResult {
        const check = this.canCraft(recipeId, catalystItemId);
        const recipe = this.recipes.get(recipeId);

        if (!check.success || !recipe) {
            return {
                success: false,
                recipeId,
                failureReason: check.reason ?? CraftFailReason.RECIPE_NOT_FOUND,
            };
        }

        const requirements: RecipeMaterialRequirement[] = [
            ...recipe.materials,
        ];

        if (catalystItemId) {
            requirements.push({ itemId: catalystItemId, quantity: 1 });
        }

        const snapshots = this.createTransactionSnapshots(requirements);

        if (!this.inventory.removeItemsAtomically(requirements)) {
            return {
                success: false,
                recipeId,
                failureReason: CraftFailReason.MISSING_MATERIAL,
            };
        }

        if (!this.spendSpiritStone(recipe.spiritStoneCost)) {
            this.restoreTransactionSnapshots(snapshots);

            return {
                success: false,
                recipeId,
                failureReason: CraftFailReason.NOT_ENOUGH_SPIRIT_STONE,
            };
        }

        return {
            success: true,
            recipeId,
            outputId: recipe.outputId,
            rarity,
            usedCatalystId: catalystItemId,
        };
    }

    private isCatalystSelectionValid(
        recipe: CraftingRecipe,
        catalystItemId: string | undefined,
        requireOwnership: boolean,
    ): boolean {
        if (!catalystItemId) {
            return true;
        }

        const catalyst = this.catalysts.get(catalystItemId);

        return Boolean(
            catalyst &&
            this.isCatalystCompatible(recipe, catalyst) &&
            (!requireOwnership || this.inventory.hasItem(catalystItemId, 1)),
        );
    }

    private isCatalystCompatible(
        recipe: CraftingRecipe,
        catalyst: CraftingCatalystDefinition,
    ): boolean {
        if (catalyst.catalystType === CraftingCatalystType.UNIVERSAL) {
            return true;
        }

        return (
            recipe.type === CraftingType.EQUIPMENT &&
            catalyst.catalystType === CraftingCatalystType.EQUIPMENT
        ) || (
            recipe.type === CraftingType.ALCHEMY &&
            catalyst.catalystType === CraftingCatalystType.ALCHEMY
        );
    }

    private createTransactionSnapshots(
        requirements: ReadonlyArray<RecipeMaterialRequirement>,
    ): TransactionSnapshot[] {
        const totals = this.aggregateRequirements(requirements);
        const snapshots: TransactionSnapshot[] = [];

        for (const [itemId, quantity] of totals) {
            const inventoryItem = this.inventory.getItem(itemId);

            if (inventoryItem) {
                snapshots.push({ item: inventoryItem.item, quantity });
            }
        }

        return snapshots;
    }

    private restoreTransactionSnapshots(
        snapshots: ReadonlyArray<TransactionSnapshot>,
    ): void {
        for (const snapshot of snapshots) {
            this.inventory.addItem(snapshot.item, snapshot.quantity);
        }
    }

    private aggregateRequirements(
        requirements: ReadonlyArray<RecipeMaterialRequirement>,
    ): Map<string, number> {
        const totals = new Map<string, number>();

        for (const requirement of requirements) {
            totals.set(
                requirement.itemId,
                (totals.get(requirement.itemId) ?? 0) + requirement.quantity,
            );
        }

        return totals;
    }

    private cloneRecipe(recipe: CraftingRecipe): CraftingRecipe {
        return {
            ...recipe,
            materials: recipe.materials.map((material) => ({ ...material })),
        };
    }
}
