import type { ItemDefinition } from "../items/Item";
import { ItemType } from "../items/Item";
import type { MaterialCategory } from "./MaterialCategory";

export interface MaterialDefinition extends ItemDefinition {
    type: ItemType.MATERIAL;
    materialCategory: MaterialCategory;
    tier: number;
}

export function isMaterialDefinition(
    item: ItemDefinition,
): item is MaterialDefinition {
    return item.type === ItemType.MATERIAL &&
        "materialCategory" in item &&
        "tier" in item;
}
