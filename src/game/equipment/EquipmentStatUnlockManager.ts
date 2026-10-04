import type { Inventory } from "../inventory/Inventory";
import { MATERIAL_DATA } from "../materials/materialData";
import type { StatModifier } from "../stats/StatModifier";
import { CURRENT_MAX_STAT_LINE_COUNT, INITIAL_STAT_LINE_COUNT, SLOT_STAT_POOLS } from "./equipmentConfig";
import type { EquipmentInstance } from "./EquipmentInstance";
import type { EquipmentManager } from "./EquipmentManager";
import type { EquipmentStatRoller } from "./EquipmentStatRoller";
import type { StatType } from "../stats/StatType";
import {
    EQUIPMENT_STAT_UNLOCK_BASE_COST_BY_TARGET_LINE,
    EQUIPMENT_STAT_UNLOCK_REALM_COST_MULTIPLIER,
} from "./equipmentStatUnlockConfig";
import type { EquipmentStatUnlockCost } from "./equipmentStatUnlockConfig";

export enum EquipmentStatUnlockFailReason {
    ITEM_NOT_FOUND = "item_not_found",
    MAX_LINES_REACHED = "max_lines_reached",
    INVALID_STAT_POOL = "invalid_stat_pool",
    NOT_ENOUGH_ESSENCE = "not_enough_essence",
    NOT_ENOUGH_SPIRIT_STONE = "not_enough_spirit_stone",
    INVALID_EQUIPMENT = "invalid_equipment",
}

export interface EquipmentStatUnlockCheck {
    success: boolean;
    reason?: EquipmentStatUnlockFailReason;
}

export interface EquipmentStatUnlockPreview {
    instanceId: string;
    equipmentName: string;
    currentLineCount: number;
    maximumLineCount: number;
    targetLine: number;
    cost: EquipmentStatUnlockCost;
    ownedEssence: number;
    ownedSpiritStone: number;
    availableStatTypes: ReadonlyArray<StatType>;
}

export interface EquipmentStatUnlockResult extends EquipmentStatUnlockCheck {
    equipment?: EquipmentInstance;
    newModifier?: StatModifier;
    cost?: EquipmentStatUnlockCost;
}

export interface EquipmentStatUnlockManagerOptions {
    inventory: Inventory;
    equipmentManager: EquipmentManager;
    statRoller: EquipmentStatRoller;
    getSpiritStone: () => number;
    spendSpiritStone: (amount: number) => boolean;
    refundSpiritStone: (amount: number) => void;
}

export class EquipmentStatUnlockManager {
    private options: EquipmentStatUnlockManagerOptions;

    constructor(options: EquipmentStatUnlockManagerOptions) {
        this.options = options;
    }

    public canUnlockNextStatLine(
        instanceId: string,
    ): EquipmentStatUnlockCheck {
        const equipment = this.options.inventory.getEquipmentInstance(instanceId);

        if (!equipment) {
            return this.failure(EquipmentStatUnlockFailReason.ITEM_NOT_FOUND);
        }

        const validation = this.validateEquipment(equipment);

        if (!validation.success) {
            return validation;
        }

        const preview = this.buildPreview(equipment);

        if (!preview) {
            return this.failure(EquipmentStatUnlockFailReason.INVALID_EQUIPMENT);
        }

        if (preview.ownedEssence < preview.cost.essence) {
            return this.failure(EquipmentStatUnlockFailReason.NOT_ENOUGH_ESSENCE);
        }

        if (preview.ownedSpiritStone < preview.cost.spiritStone) {
            return this.failure(
                EquipmentStatUnlockFailReason.NOT_ENOUGH_SPIRIT_STONE,
            );
        }

        return { success: true };
    }

    public getUnlockPreview(
        instanceId: string,
    ): EquipmentStatUnlockPreview | null {
        const equipment = this.options.inventory.getEquipmentInstance(instanceId);

        if (!equipment || !this.validateEquipment(equipment).success) {
            return null;
        }

        return this.buildPreview(equipment);
    }

    public unlockNextStatLine(
        instanceId: string,
    ): EquipmentStatUnlockResult {
        const check = this.canUnlockNextStatLine(instanceId);

        if (!check.success) {
            return check;
        }

        const equipment = this.options.inventory.getEquipmentInstance(instanceId);
        const preview = equipment ? this.buildPreview(equipment) : null;

        if (!equipment || !preview) {
            return this.failure(EquipmentStatUnlockFailReason.INVALID_EQUIPMENT);
        }

        let rolledModifier: StatModifier | null = null;

        try {
            rolledModifier = this.options.statRoller.rollAdditionalStat(equipment);
        } catch {
            return this.failure(EquipmentStatUnlockFailReason.INVALID_STAT_POOL);
        }

        if (
            !rolledModifier ||
            !preview.availableStatTypes.includes(rolledModifier.stat) ||
            !Number.isFinite(rolledModifier.value)
        ) {
            return this.failure(EquipmentStatUnlockFailReason.INVALID_STAT_POOL);
        }

        const modifierIndex = equipment.rolledStats.length;
        const newModifier: StatModifier = {
            ...rolledModifier,
            id: `equipment-roll:${equipment.instanceId}:${modifierIndex}`,
            source: `equipment:${equipment.instanceId}`,
        };
        const updatedEquipment: EquipmentInstance = {
            ...equipment,
            rolledStats: [
                ...equipment.rolledStats.map((modifier) => ({ ...modifier })),
                newModifier,
            ],
            unlockedStatLineCount: preview.targetLine,
        };

        if (!this.options.inventory.removeItem(
            MATERIAL_DATA.EQUIPMENT_ESSENCE.id,
            preview.cost.essence,
        )) {
            return this.failure(EquipmentStatUnlockFailReason.NOT_ENOUGH_ESSENCE);
        }

        if (!this.options.spendSpiritStone(preview.cost.spiritStone)) {
            this.options.inventory.addItem(
                MATERIAL_DATA.EQUIPMENT_ESSENCE,
                preview.cost.essence,
            );
            return this.failure(
                EquipmentStatUnlockFailReason.NOT_ENOUGH_SPIRIT_STONE,
            );
        }

        if (!this.options.inventory.replaceEquipmentInstance(updatedEquipment)) {
            this.options.inventory.addItem(
                MATERIAL_DATA.EQUIPMENT_ESSENCE,
                preview.cost.essence,
            );
            this.options.refundSpiritStone(preview.cost.spiritStone);
            return this.failure(EquipmentStatUnlockFailReason.INVALID_EQUIPMENT);
        }

        this.options.equipmentManager.refreshEquippedItemModifiers(
            updatedEquipment,
        );

        return {
            success: true,
            equipment: updatedEquipment,
            newModifier,
            cost: preview.cost,
        };
    }

    private validateEquipment(
        equipment: EquipmentInstance,
    ): EquipmentStatUnlockCheck {
        const actualLineCount = equipment.rolledStats.length;

        if (
            equipment.unlockedStatLineCount >= CURRENT_MAX_STAT_LINE_COUNT ||
            actualLineCount >= CURRENT_MAX_STAT_LINE_COUNT
        ) {
            return this.failure(EquipmentStatUnlockFailReason.MAX_LINES_REACHED);
        }

        if (
            equipment.unlockedStatLineCount !== actualLineCount ||
            actualLineCount !== INITIAL_STAT_LINE_COUNT
        ) {
            console.warn(
                `Invalid equipment line state: ${equipment.instanceId}`,
            );
            return this.failure(EquipmentStatUnlockFailReason.INVALID_EQUIPMENT);
        }

        const pool = SLOT_STAT_POOLS[equipment.definition.slot];
        const existingStats = new Set(
            equipment.rolledStats.map((modifier) => modifier.stat),
        );

        if (
            existingStats.size !== actualLineCount ||
            equipment.rolledStats.some((modifier) => !pool.includes(modifier.stat))
        ) {
            return this.failure(EquipmentStatUnlockFailReason.INVALID_STAT_POOL);
        }

        const availableStats = pool.filter((stat) => !existingStats.has(stat));

        if (availableStats.length === 0) {
            return this.failure(EquipmentStatUnlockFailReason.INVALID_STAT_POOL);
        }

        return { success: true };
    }

    private buildPreview(
        equipment: EquipmentInstance,
    ): EquipmentStatUnlockPreview | null {
        const targetLine = equipment.rolledStats.length + 1;
        const rarityCosts =
            EQUIPMENT_STAT_UNLOCK_BASE_COST_BY_TARGET_LINE[targetLine];
        const baseCost = rarityCosts?.[equipment.rarity];
        const realmMultiplier =
            EQUIPMENT_STAT_UNLOCK_REALM_COST_MULTIPLIER[
                equipment.definition.requiredRealm
            ];

        if (!baseCost || !Number.isFinite(realmMultiplier)) {
            return null;
        }

        const existingStats = new Set(
            equipment.rolledStats.map((modifier) => modifier.stat),
        );
        const availableStatTypes = SLOT_STAT_POOLS[
            equipment.definition.slot
        ].filter((stat) => !existingStats.has(stat));
        const cost = {
            essence: Math.max(1, Math.round(baseCost.essence * realmMultiplier)),
            spiritStone: Math.max(
                1,
                Math.round(baseCost.spiritStone * realmMultiplier),
            ),
        };

        return {
            instanceId: equipment.instanceId,
            equipmentName: equipment.definition.name,
            currentLineCount: equipment.rolledStats.length,
            maximumLineCount: CURRENT_MAX_STAT_LINE_COUNT,
            targetLine,
            cost,
            ownedEssence: this.options.inventory.getQuantity(
                MATERIAL_DATA.EQUIPMENT_ESSENCE.id,
            ),
            ownedSpiritStone: this.options.getSpiritStone(),
            availableStatTypes,
        };
    }

    private failure(
        reason: EquipmentStatUnlockFailReason,
    ): EquipmentStatUnlockCheck {
        return { success: false, reason };
    }
}
