import type { Inventory } from "../inventory/Inventory";
import { MATERIAL_DATA } from "../materials/materialData";
import type { EquipmentManager } from "./EquipmentManager";
import type { EquipmentRarity } from "./EquipmentRarity";
import { EQUIPMENT_SALVAGE_ESSENCE_BY_RARITY } from "./equipmentSalvageConfig";

export enum EquipmentSalvageFailReason {
    ITEM_NOT_FOUND = "item_not_found",
    ITEM_CURRENTLY_EQUIPPED = "item_currently_equipped",
    INVALID_EQUIPMENT = "invalid_equipment",
    REWARD_CAPACITY_EXCEEDED = "reward_capacity_exceeded",
}

export interface EquipmentSalvageCheck {
    success: boolean;
    reason?: EquipmentSalvageFailReason;
}

export interface EquipmentSalvagePreview {
    instanceId: string;
    equipmentName: string;
    rarity: EquipmentRarity;
    essenceItemId: string;
    essenceName: string;
    essenceQuantity: number;
}

export interface EquipmentSalvageResult extends EquipmentSalvageCheck {
    preview?: EquipmentSalvagePreview;
}

export class EquipmentSalvageManager {
    private inventory: Inventory;
    private equipmentManager: EquipmentManager;

    constructor(
        inventory: Inventory,
        equipmentManager: EquipmentManager,
    ) {
        this.inventory = inventory;
        this.equipmentManager = equipmentManager;
    }

    public canSalvage(instanceId: string): EquipmentSalvageCheck {
        const equipment = this.inventory.getEquipmentInstance(instanceId);

        if (!equipment) {
            return {
                success: false,
                reason: EquipmentSalvageFailReason.ITEM_NOT_FOUND,
            };
        }

        if (this.equipmentManager.isEquipped(instanceId)) {
            return {
                success: false,
                reason: EquipmentSalvageFailReason.ITEM_CURRENTLY_EQUIPPED,
            };
        }

        const reward = EQUIPMENT_SALVAGE_ESSENCE_BY_RARITY[equipment.rarity];

        if (!Number.isFinite(reward) || reward <= 0) {
            return {
                success: false,
                reason: EquipmentSalvageFailReason.INVALID_EQUIPMENT,
            };
        }

        if (!this.inventory.canAddItem(MATERIAL_DATA.EQUIPMENT_ESSENCE, reward)) {
            return {
                success: false,
                reason: EquipmentSalvageFailReason.REWARD_CAPACITY_EXCEEDED,
            };
        }

        return { success: true };
    }

    public getSalvagePreview(
        instanceId: string,
    ): EquipmentSalvagePreview | null {
        const equipment = this.inventory.getEquipmentInstance(instanceId);

        if (!equipment) {
            return null;
        }

        const essenceQuantity =
            EQUIPMENT_SALVAGE_ESSENCE_BY_RARITY[equipment.rarity];

        if (!Number.isFinite(essenceQuantity) || essenceQuantity <= 0) {
            return null;
        }

        return {
            instanceId: equipment.instanceId,
            equipmentName: equipment.definition.name,
            rarity: equipment.rarity,
            essenceItemId: MATERIAL_DATA.EQUIPMENT_ESSENCE.id,
            essenceName: MATERIAL_DATA.EQUIPMENT_ESSENCE.name,
            essenceQuantity,
        };
    }

    public salvage(instanceId: string): EquipmentSalvageResult {
        const check = this.canSalvage(instanceId);

        if (!check.success) {
            return check;
        }

        const preview = this.getSalvagePreview(instanceId);

        if (!preview || !this.inventory.removeEquipmentInstance(instanceId)) {
            return {
                success: false,
                reason: EquipmentSalvageFailReason.INVALID_EQUIPMENT,
            };
        }

        this.inventory.addItem(
            MATERIAL_DATA.EQUIPMENT_ESSENCE,
            preview.essenceQuantity,
        );

        return { success: true, preview };
    }
}
