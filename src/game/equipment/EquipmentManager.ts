import {
    getCultivationRealmRank,
} from "../cultivation/CultivationRealm";
import type { CultivationRealm } from "../cultivation/CultivationRealm";
import type { Player } from "../entities/Player";
import type { Inventory } from "../inventory/Inventory";
import type { EquipmentInstance } from "./EquipmentInstance";
import type { EquipmentSlot } from "./EquipmentSlot";

export class EquipmentManager {
    private player: Player;
    private inventory: Inventory;
    private getCurrentRealm: () => CultivationRealm;
    private equipped: Map<EquipmentSlot, EquipmentInstance>;
    private version: number;

    constructor(
        player: Player,
        inventory: Inventory,
        getCurrentRealm: () => CultivationRealm,
    ) {
        this.player = player;
        this.inventory = inventory;
        this.getCurrentRealm = getCurrentRealm;
        this.equipped = new Map<EquipmentSlot, EquipmentInstance>();
        this.version = 0;
    }

    public equip(equipment: EquipmentInstance): boolean {
        if (!this.canEquip(equipment)) {
            return false;
        }

        const slot = equipment.definition.slot;
        const currentEquipment = this.equipped.get(slot);

        if (currentEquipment?.instanceId === equipment.instanceId) {
            return true;
        }

        if (currentEquipment) {
            this.removeEquipmentModifiers(currentEquipment);
        }

        this.equipped.set(slot, equipment);
        this.addEquipmentModifiers(equipment);
        this.player.syncCurrentResourcesWithMaxStats();
        this.version += 1;

        return true;
    }

    public unequip(slot: EquipmentSlot): boolean {
        const equipment = this.equipped.get(slot);

        if (!equipment) {
            return false;
        }

        this.removeEquipmentModifiers(equipment);
        this.equipped.delete(slot);
        this.player.syncCurrentResourcesWithMaxStats();
        this.version += 1;

        return true;
    }

    public getEquippedItem(
        slot: EquipmentSlot,
    ): EquipmentInstance | null {
        return this.equipped.get(slot) ?? null;
    }

    public getAllEquippedItems(): EquipmentInstance[] {
        return Array.from(this.equipped.values());
    }

    public canEquip(equipment: EquipmentInstance): boolean {
        if (
            !this.inventory.hasEquipmentInstance(equipment.instanceId)
        ) {
            return false;
        }

        return (
            getCultivationRealmRank(this.getCurrentRealm()) >=
            getCultivationRealmRank(equipment.definition.requiredRealm)
        );
    }

    public isEquipped(instanceId: string): boolean {
        return this.getAllEquippedItems().some(
            (equipment) => equipment.instanceId === instanceId,
        );
    }

    public getVersion(): number {
        return this.version;
    }

    public clearEquipped(): void {
        for (const equipment of this.equipped.values()) {
            this.removeEquipmentModifiers(equipment);
        }

        this.equipped.clear();
        this.player.syncCurrentResourcesWithMaxStats();
        this.version += 1;
    }

    private addEquipmentModifiers(
        equipment: EquipmentInstance,
    ): void {
        equipment.rolledStats.forEach((modifier, index) => {
            this.player.getStatSystem().addModifier({
                ...modifier,
                id: this.getAppliedModifierId(equipment, index),
                source: `equipment:${equipment.instanceId}`,
            });
        });
    }

    private removeEquipmentModifiers(
        equipment: EquipmentInstance,
    ): void {
        equipment.rolledStats.forEach((_modifier, index) => {
            this.player
                .getStatSystem()
                .removeModifier(this.getAppliedModifierId(equipment, index));
        });
    }

    private getAppliedModifierId(
        equipment: EquipmentInstance,
        index: number,
    ): string {
        return `equipment:${equipment.instanceId}:${index}`;
    }
}
