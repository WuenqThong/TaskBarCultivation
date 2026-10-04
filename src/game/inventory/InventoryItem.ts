import type { ItemDefinition } from "../items/Item";

export interface InventoryItem {
    item: ItemDefinition;
    quantity: number;
}
