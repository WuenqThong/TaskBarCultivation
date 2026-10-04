import type { BuffManager } from "../buffs/BuffManager";
import type { CraftingManager } from "../crafting/CraftingManager";
import type { CraftPreview } from "../crafting/CraftingPreview";
import type { CraftingRecipe } from "../crafting/CraftingRecipe";
import { CraftFailReason } from "../crafting/CraftingResult";
import type { GameRarity } from "../crafting/CraftingResult";
import { CraftingType } from "../crafting/CraftingType";
import type { Player } from "../entities/Player";
import type { Inventory } from "../inventory/Inventory";
import { StatModifierType } from "../stats/StatModifier";
import { StatType } from "../stats/StatType";
import { PILL_RARITY_EFFECT_MULTIPLIER } from "./alchemyConfig";
import { PillEffectType } from "./Pill";
import type { PillDefinition, PillEffectPreview } from "./Pill";
import type { PillCraftResult } from "./PillCraftResult";

interface AlchemyManagerOptions {
    craftingManager: CraftingManager;
    inventory: Inventory;
    pillDefinitions: ReadonlyArray<PillDefinition>;
    player: Player;
    buffManager: BuffManager;
}

export class AlchemyManager {
    private craftingManager: CraftingManager;
    private inventory: Inventory;
    private pillDefinitions: Map<string, PillDefinition>;
    private player: Player;
    private buffManager: BuffManager;

    constructor(options: AlchemyManagerOptions) {
        this.craftingManager = options.craftingManager;
        this.inventory = options.inventory;
        this.pillDefinitions = new Map(
            options.pillDefinitions.map((definition) => [definition.id, definition]),
        );
        this.player = options.player;
        this.buffManager = options.buffManager;
    }

    public getPillRecipes(): CraftingRecipe[] {
        return this.craftingManager.getRecipesByType(CraftingType.ALCHEMY);
    }

    public getPreview(
        recipeId: string,
        catalystItemId?: string,
    ): CraftPreview | null {
        const recipe = this.craftingManager.getRecipe(recipeId);

        if (!recipe || recipe.type !== CraftingType.ALCHEMY) {
            return null;
        }

        return this.craftingManager.getCraftPreview(recipeId, catalystItemId);
    }

    public getPillDefinition(definitionId: string): PillDefinition | null {
        return this.pillDefinitions.get(definitionId) ?? null;
    }

    public getPillEffectPreview(
        definitionId: string,
        rarity: GameRarity,
    ): PillEffectPreview | null {
        const definition = this.pillDefinitions.get(definitionId);

        if (!definition) {
            return null;
        }

        return {
            definitionId,
            rarity,
            effectType: definition.effectType,
            effectValue:
                definition.baseEffectValue *
                PILL_RARITY_EFFECT_MULTIPLIER[rarity],
            duration: definition.duration,
        };
    }

    public craftPill(
        recipeId: string,
        catalystItemId?: string,
    ): PillCraftResult {
        const recipe = this.craftingManager.getRecipe(recipeId);

        if (!recipe) {
            return this.failure(recipeId, CraftFailReason.RECIPE_NOT_FOUND);
        }

        if (recipe.type !== CraftingType.ALCHEMY) {
            return this.failure(recipeId, CraftFailReason.INVALID_RECIPE_TYPE);
        }

        const definition = this.pillDefinitions.get(recipe.outputId);

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

        const rarity = this.craftingManager.rollRarity(recipeId, catalystItemId);

        if (!rarity) {
            return this.failure(recipeId, CraftFailReason.INVALID_CATALYST);
        }

        const quantity = Math.max(1, Math.floor(recipe.outputQuantity ?? 1));

        this.inventory.addPill(definition.id, rarity, quantity);
        const transaction = this.craftingManager.commitCraft(
            recipeId,
            rarity,
            catalystItemId,
        );

        if (!transaction.success) {
            this.inventory.removePill(definition.id, rarity, quantity);
            return this.failure(
                recipeId,
                transaction.failureReason ?? CraftFailReason.MISSING_MATERIAL,
            );
        }

        return {
            success: true,
            recipeId,
            pillId: definition.id,
            rarity,
            quantity,
            usedCatalystId: catalystItemId,
        };
    }

    public usePill(definitionId: string, rarity: GameRarity): boolean {
        const definition = this.pillDefinitions.get(definitionId);

        if (
            !definition ||
            this.player.isDead() ||
            this.inventory.getPillQuantity(definitionId, rarity) <= 0
        ) {
            return false;
        }

        const preview = this.getPillEffectPreview(definitionId, rarity);

        if (!preview || !this.canApplyEffect(definition.effectType)) {
            return false;
        }

        if (!this.inventory.removePill(definitionId, rarity, 1)) {
            return false;
        }

        if (definition.effectType === PillEffectType.RESTORE_HP) {
            this.player.restoreHp(this.player.getMaxHp() * preview.effectValue);
        } else if (definition.effectType === PillEffectType.RESTORE_MP) {
            this.player.restoreMp(this.player.getMaxMp() * preview.effectValue);
        } else {
            this.buffManager.addBuff(
                `pill:${definition.id}`,
                [{
                    stat: StatType.CULTIVATION_SPEED,
                    type: StatModifierType.FLAT,
                    value: preview.effectValue,
                }],
                preview.duration ?? 0,
            );
        }

        return true;
    }

    private canApplyEffect(effectType: PillEffectType): boolean {
        if (effectType === PillEffectType.RESTORE_HP) {
            return this.player.getHp() < this.player.getMaxHp();
        }

        if (effectType === PillEffectType.RESTORE_MP) {
            return this.player.getMp() < this.player.getMaxMp();
        }

        return true;
    }

    private failure(
        recipeId: string,
        failureReason: CraftFailReason,
    ): PillCraftResult {
        return { success: false, recipeId, failureReason };
    }
}
