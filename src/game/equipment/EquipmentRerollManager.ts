import type { Inventory } from "../inventory/Inventory";
import { MATERIAL_DATA } from "../materials/materialData";
import type { StatModifier } from "../stats/StatModifier";
import { SLOT_STAT_POOLS } from "./equipmentConfig";
import type { EquipmentInstance } from "./EquipmentInstance";
import type { EquipmentManager } from "./EquipmentManager";
import type { EquipmentStatRoller } from "./EquipmentStatRoller";
import {
    EQUIPMENT_REROLL_BASE_COST,
    EQUIPMENT_REROLL_LOCK_COST_MULTIPLIER,
    EQUIPMENT_REROLL_REALM_COST_MULTIPLIER,
} from "./equipmentRerollConfig";
import type { EquipmentRerollCost } from "./equipmentRerollConfig";

export enum EquipmentRerollFailReason {
    ITEM_NOT_FOUND = "item_not_found",
    NO_STATS = "no_stats",
    ALL_STATS_LOCKED = "all_stats_locked",
    NOT_ENOUGH_ESSENCE = "not_enough_essence",
    NOT_ENOUGH_SPIRIT_STONE = "not_enough_spirit_stone",
    INVALID_STAT_CONFIGURATION = "invalid_stat_configuration",
}

export interface EquipmentRerollCheck {
    success: boolean;
    reason?: EquipmentRerollFailReason;
}

export interface EquipmentRerollPreview {
    instanceId: string;
    equipmentName: string;
    lineCount: number;
    lockedCount: number;
    unlockedCount: number;
    cost: EquipmentRerollCost;
    ownedEssence: number;
    ownedSpiritStone: number;
}

export interface EquipmentStatLockResult extends EquipmentRerollCheck {
    equipment?: EquipmentInstance;
    locked?: boolean;
}

export interface EquipmentRerollResult extends EquipmentRerollCheck {
    equipment?: EquipmentInstance;
    previousStats?: StatModifier[];
    newStats?: StatModifier[];
    rerolledIndices?: number[];
    cost?: EquipmentRerollCost;
}

export interface EquipmentRerollManagerOptions {
    inventory: Inventory;
    equipmentManager: EquipmentManager;
    statRoller: EquipmentStatRoller;
    getSpiritStone: () => number;
    spendSpiritStone: (amount: number) => boolean;
    refundSpiritStone: (amount: number) => void;
}

export class EquipmentRerollManager {
    private options: EquipmentRerollManagerOptions;

    constructor(options: EquipmentRerollManagerOptions) {
        this.options = options;
    }

    public toggleStatLock(
        instanceId: string,
        statIndex: number,
    ): EquipmentStatLockResult {
        const equipment = this.options.inventory.getEquipmentInstance(instanceId);

        if (!equipment) {
            return this.failure(EquipmentRerollFailReason.ITEM_NOT_FOUND);
        }

        const validation = this.validateEquipment(equipment);

        if (!validation.success) {
            return validation;
        }

        if (!Number.isInteger(statIndex) || statIndex < 0 ||
            statIndex >= equipment.rolledStats.length) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        const currentlyLocked = equipment.lockedStatIndices.includes(statIndex);
        const lockedStatIndices = currentlyLocked
            ? equipment.lockedStatIndices.filter((index) => index !== statIndex)
            : [...equipment.lockedStatIndices, statIndex].sort(
                (left, right) => left - right,
            );
        const updatedEquipment: EquipmentInstance = {
            ...equipment,
            lockedStatIndices,
        };

        if (!this.options.inventory.replaceEquipmentInstance(updatedEquipment)) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        return {
            success: true,
            equipment: updatedEquipment,
            locked: !currentlyLocked,
        };
    }

    public getRerollPreview(
        instanceId: string,
    ): EquipmentRerollPreview | null {
        const equipment = this.options.inventory.getEquipmentInstance(instanceId);

        if (!equipment || !this.validateEquipment(equipment).success ||
            equipment.lockedStatIndices.length >= equipment.rolledStats.length) {
            return null;
        }

        return this.buildPreview(equipment);
    }

    public canReroll(instanceId: string): EquipmentRerollCheck {
        const equipment = this.options.inventory.getEquipmentInstance(instanceId);

        if (!equipment) {
            return this.failure(EquipmentRerollFailReason.ITEM_NOT_FOUND);
        }

        const validation = this.validateEquipment(equipment);

        if (!validation.success) {
            return validation;
        }

        if (equipment.lockedStatIndices.length === equipment.rolledStats.length) {
            return this.failure(EquipmentRerollFailReason.ALL_STATS_LOCKED);
        }

        const preview = this.buildPreview(equipment);

        if (!preview) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        if (preview.ownedEssence < preview.cost.essence) {
            return this.failure(EquipmentRerollFailReason.NOT_ENOUGH_ESSENCE);
        }

        if (preview.ownedSpiritStone < preview.cost.spiritStone) {
            return this.failure(
                EquipmentRerollFailReason.NOT_ENOUGH_SPIRIT_STONE,
            );
        }

        return { success: true };
    }

    public reroll(instanceId: string): EquipmentRerollResult {
        const check = this.canReroll(instanceId);

        if (!check.success) {
            return check;
        }

        const equipment = this.options.inventory.getEquipmentInstance(instanceId);
        const preview = equipment ? this.buildPreview(equipment) : null;

        if (!equipment || !preview) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        const lockedIndices = new Set(equipment.lockedStatIndices);
        const rerolledIndices = equipment.rolledStats.flatMap((_stat, index) =>
            lockedIndices.has(index) ? [] : [index],
        );
        const lockedStatTypes = new Set(
            equipment.rolledStats.flatMap((modifier, index) =>
                lockedIndices.has(index) ? [modifier.stat] : [],
            ),
        );
        let replacements: StatModifier[];

        try {
            const pool = SLOT_STAT_POOLS[equipment.definition.slot];
            const coversCurrentPool =
                equipment.rolledStats.length === pool.length &&
                pool.every((stat) => equipment.rolledStats.some(
                    (modifier) => modifier.stat === stat,
                ));

            replacements = coversCurrentPool
                ? rerolledIndices.map((index) =>
                    this.options.statRoller.rollStatOfType(
                        equipment.definition,
                        equipment.rarity,
                        equipment.rolledStats[index].stat,
                    ),
                )
                : this.options.statRoller.rollStats(
                    equipment.definition,
                    equipment.rarity,
                    rerolledIndices.length,
                    lockedStatTypes,
                );
        } catch {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        if (replacements.length !== rerolledIndices.length) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        let replacementIndex = 0;
        const newStats = equipment.rolledStats.map((modifier, index) => {
            if (lockedIndices.has(index)) {
                return { ...modifier };
            }

            const replacement = replacements[replacementIndex];
            replacementIndex += 1;
            return {
                ...replacement,
                id: `equipment-roll:${equipment.instanceId}:${index}`,
                source: `equipment:${equipment.instanceId}`,
            };
        });
        const pool = SLOT_STAT_POOLS[equipment.definition.slot];
        const resultTypes = new Set(newStats.map((modifier) => modifier.stat));

        if (resultTypes.size !== newStats.length || newStats.some(
            (modifier) => !pool.includes(modifier.stat) ||
                !Number.isFinite(modifier.value),
        )) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        const updatedEquipment: EquipmentInstance = {
            ...equipment,
            rolledStats: newStats,
            lockedStatIndices: [...equipment.lockedStatIndices],
        };

        if (!this.options.inventory.removeItem(
            MATERIAL_DATA.EQUIPMENT_ESSENCE.id,
            preview.cost.essence,
        )) {
            return this.failure(EquipmentRerollFailReason.NOT_ENOUGH_ESSENCE);
        }

        if (!this.options.spendSpiritStone(preview.cost.spiritStone)) {
            this.options.inventory.addItem(
                MATERIAL_DATA.EQUIPMENT_ESSENCE,
                preview.cost.essence,
            );
            return this.failure(
                EquipmentRerollFailReason.NOT_ENOUGH_SPIRIT_STONE,
            );
        }

        if (!this.options.inventory.replaceEquipmentInstance(updatedEquipment)) {
            this.options.inventory.addItem(
                MATERIAL_DATA.EQUIPMENT_ESSENCE,
                preview.cost.essence,
            );
            this.options.refundSpiritStone(preview.cost.spiritStone);
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        this.options.equipmentManager.refreshEquippedItemModifiers(
            updatedEquipment,
        );

        return {
            success: true,
            equipment: updatedEquipment,
            previousStats: equipment.rolledStats.map((modifier) => ({ ...modifier })),
            newStats: newStats.map((modifier) => ({ ...modifier })),
            rerolledIndices,
            cost: preview.cost,
        };
    }

    private validateEquipment(
        equipment: EquipmentInstance,
    ): EquipmentRerollCheck {
        if (equipment.rolledStats.length === 0) {
            return this.failure(EquipmentRerollFailReason.NO_STATS);
        }

        const pool = SLOT_STAT_POOLS[equipment.definition.slot];
        const statTypes = new Set(equipment.rolledStats.map(
            (modifier) => modifier.stat,
        ));
        const locks = equipment.lockedStatIndices;
        const uniqueLocks = new Set(locks);

        if (
            equipment.unlockedStatLineCount !== equipment.rolledStats.length ||
            statTypes.size !== equipment.rolledStats.length ||
            equipment.rolledStats.some((modifier) =>
                !pool.includes(modifier.stat) || !Number.isFinite(modifier.value)
            ) ||
            uniqueLocks.size !== locks.length ||
            locks.some((index) => !Number.isInteger(index) || index < 0 ||
                index >= equipment.rolledStats.length)
        ) {
            return this.failure(
                EquipmentRerollFailReason.INVALID_STAT_CONFIGURATION,
            );
        }

        return { success: true };
    }

    private buildPreview(
        equipment: EquipmentInstance,
    ): EquipmentRerollPreview | null {
        const baseCost = EQUIPMENT_REROLL_BASE_COST[equipment.rarity];
        const lockMultiplier = EQUIPMENT_REROLL_LOCK_COST_MULTIPLIER[
            equipment.lockedStatIndices.length
        ];
        const realmMultiplier = EQUIPMENT_REROLL_REALM_COST_MULTIPLIER[
            equipment.definition.requiredRealm
        ];

        if (!baseCost || !Number.isFinite(lockMultiplier) ||
            !Number.isFinite(realmMultiplier)) {
            return null;
        }

        return {
            instanceId: equipment.instanceId,
            equipmentName: equipment.definition.name,
            lineCount: equipment.rolledStats.length,
            lockedCount: equipment.lockedStatIndices.length,
            unlockedCount:
                equipment.rolledStats.length - equipment.lockedStatIndices.length,
            cost: {
                essence: Math.max(1, Math.round(
                    baseCost.essence * lockMultiplier * realmMultiplier,
                )),
                spiritStone: Math.max(1, Math.round(
                    baseCost.spiritStone * lockMultiplier * realmMultiplier,
                )),
            },
            ownedEssence: this.options.inventory.getQuantity(
                MATERIAL_DATA.EQUIPMENT_ESSENCE.id,
            ),
            ownedSpiritStone: this.options.getSpiritStone(),
        };
    }

    private failure(reason: EquipmentRerollFailReason): EquipmentRerollCheck {
        return { success: false, reason };
    }
}
