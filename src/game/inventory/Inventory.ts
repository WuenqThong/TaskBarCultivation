import type { InventoryItem } from "./InventoryItem";
import type { EquipmentInstance } from "../equipment/EquipmentInstance";
import { ItemType } from "../items/Item";
import type { ItemDefinition } from "../items/Item";
import type { GameRarity } from "../crafting/CraftingResult";
import {
    createPillStackKey,
} from "../alchemy/PillStack";
import type { PillStack } from "../alchemy/PillStack";

export class Inventory {
    private items: Map<string, InventoryItem>;
    private equipmentInstances: Map<string, EquipmentInstance>;
    private pillStacks: Map<string, PillStack>;
    private version: number;

    constructor() {
        this.items = new Map<string, InventoryItem>();
        this.equipmentInstances = new Map<string, EquipmentInstance>();
        this.pillStacks = new Map<string, PillStack>();
        this.version = 0;
    }

    public addItem(
        item: ItemDefinition,
        quantity = 1,
    ): void {
        const amount = Math.floor(quantity);

        if (
            amount <= 0 ||
            item.maxStack <= 0 ||
            item.type === ItemType.EQUIPMENT
        ) {
            return;
        }

        const currentItem = this.items.get(item.id);
        const currentQuantity = currentItem?.quantity ?? 0;
        const maximumQuantity = item.stackable ? item.maxStack : 1;
        const nextQuantity = Math.min(
            currentQuantity + amount,
            maximumQuantity,
        );

        if (nextQuantity === currentQuantity) {
            return;
        }

        this.items.set(item.id, {
            item,
            quantity: nextQuantity,
        });
        this.version += 1;
    }

    public canAddItem(
        item: ItemDefinition,
        quantity = 1,
    ): boolean {
        const amount = Math.floor(quantity);

        if (
            amount <= 0 ||
            item.maxStack <= 0 ||
            item.type === ItemType.EQUIPMENT
        ) {
            return false;
        }

        const currentQuantity = this.items.get(item.id)?.quantity ?? 0;
        const maximumQuantity = item.stackable ? item.maxStack : 1;

        return currentQuantity + amount <= maximumQuantity;
    }

    public removeItem(
        itemId: string,
        quantity = 1,
    ): boolean {
        const amount = Math.floor(quantity);
        const inventoryItem = this.items.get(itemId);

        if (
            amount <= 0 ||
            !inventoryItem ||
            inventoryItem.quantity < amount
        ) {
            return false;
        }

        const nextQuantity = inventoryItem.quantity - amount;

        if (nextQuantity === 0) {
            this.items.delete(itemId);
        } else {
            this.items.set(itemId, {
                item: inventoryItem.item,
                quantity: nextQuantity,
            });
        }

        this.version += 1;

        return true;
    }

    public removeItemsAtomically(
        requirements: ReadonlyArray<{
            itemId: string;
            quantity: number;
        }>,
    ): boolean {
        const totals = new Map<string, number>();

        for (const requirement of requirements) {
            const amount = Math.floor(requirement.quantity);

            if (amount <= 0) {
                return false;
            }

            totals.set(
                requirement.itemId,
                (totals.get(requirement.itemId) ?? 0) + amount,
            );
        }

        for (const [itemId, amount] of totals) {
            if (!this.hasItem(itemId, amount)) {
                return false;
            }
        }

        for (const [itemId, amount] of totals) {
            const inventoryItem = this.items.get(itemId);

            if (!inventoryItem) {
                return false;
            }

            const nextQuantity = inventoryItem.quantity - amount;

            if (nextQuantity === 0) {
                this.items.delete(itemId);
            } else {
                this.items.set(itemId, {
                    item: inventoryItem.item,
                    quantity: nextQuantity,
                });
            }
        }

        if (totals.size > 0) {
            this.version += 1;
        }

        return true;
    }

    public getQuantity(itemId: string): number {
        return this.items.get(itemId)?.quantity ?? 0;
    }

    public addPill(
        definitionId: string,
        rarity: GameRarity,
        quantity = 1,
    ): boolean {
        const amount = Math.floor(quantity);

        if (amount <= 0) {
            return false;
        }

        const key = createPillStackKey(definitionId, rarity);
        const current = this.pillStacks.get(key);

        this.pillStacks.set(key, {
            definitionId,
            rarity,
            quantity: (current?.quantity ?? 0) + amount,
        });
        this.version += 1;
        return true;
    }

    public removePill(
        definitionId: string,
        rarity: GameRarity,
        quantity = 1,
    ): boolean {
        const amount = Math.floor(quantity);
        const key = createPillStackKey(definitionId, rarity);
        const current = this.pillStacks.get(key);

        if (amount <= 0 || !current || current.quantity < amount) {
            return false;
        }

        const nextQuantity = current.quantity - amount;

        if (nextQuantity === 0) {
            this.pillStacks.delete(key);
        } else {
            this.pillStacks.set(key, { ...current, quantity: nextQuantity });
        }

        this.version += 1;
        return true;
    }

    public getPillQuantity(
        definitionId: string,
        rarity: GameRarity,
    ): number {
        return this.pillStacks.get(
            createPillStackKey(definitionId, rarity),
        )?.quantity ?? 0;
    }

    public getPillStacks(): PillStack[] {
        return Array.from(this.pillStacks.values(), (stack) => ({ ...stack }));
    }

    public getItem(itemId: string): InventoryItem | null {
        const inventoryItem = this.items.get(itemId);

        if (!inventoryItem) {
            return null;
        }

        return { ...inventoryItem };
    }

    public getItems(): InventoryItem[] {
        return Array.from(
            this.items.values(),
            (inventoryItem) => ({ ...inventoryItem }),
        );
    }

    public addEquipmentInstance(
        equipment: EquipmentInstance,
    ): boolean {
        if (this.equipmentInstances.has(equipment.instanceId)) {
            return false;
        }

        this.equipmentInstances.set(
            equipment.instanceId,
            this.cloneEquipmentInstance(equipment),
        );
        this.version += 1;

        return true;
    }

    public removeEquipmentInstance(instanceId: string): boolean {
        const removed = this.equipmentInstances.delete(instanceId);

        if (removed) {
            this.version += 1;
        }

        return removed;
    }

    public replaceEquipmentInstance(
        equipment: EquipmentInstance,
    ): boolean {
        if (!this.equipmentInstances.has(equipment.instanceId)) {
            return false;
        }

        this.equipmentInstances.set(
            equipment.instanceId,
            this.cloneEquipmentInstance(equipment),
        );
        this.version += 1;
        return true;
    }

    public getEquipmentInstance(
        instanceId: string,
    ): EquipmentInstance | null {
        const equipment = this.equipmentInstances.get(instanceId);

        return equipment
            ? this.cloneEquipmentInstance(equipment)
            : null;
    }

    public getEquipmentInstances(): EquipmentInstance[] {
        return Array.from(
            this.equipmentInstances.values(),
            (equipment) => this.cloneEquipmentInstance(equipment),
        );
    }

    public hasEquipmentInstance(instanceId: string): boolean {
        return this.equipmentInstances.has(instanceId);
    }

    public hasItem(
        itemId: string,
        quantity = 1,
    ): boolean {
        const amount = Math.floor(quantity);
        const inventoryItem = this.items.get(itemId);

        return amount > 0 && Boolean(
            inventoryItem && inventoryItem.quantity >= amount,
        );
    }

    public clear(): void {
        if (
            this.items.size === 0 &&
            this.equipmentInstances.size === 0 &&
            this.pillStacks.size === 0
        ) {
            return;
        }

        this.items.clear();
        this.equipmentInstances.clear();
        this.pillStacks.clear();
        this.version += 1;
    }

    public getVersion(): number {
        return this.version;
    }

    private cloneEquipmentInstance(
        equipment: EquipmentInstance,
    ): EquipmentInstance {
        return {
            ...equipment,
            rolledStats: equipment.rolledStats.map(
                (modifier) => ({ ...modifier }),
            ),
            lockedStatIndices: [...equipment.lockedStatIndices],
        };
    }
}
