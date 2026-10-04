export enum ItemType {
    EQUIPMENT = "equipment",
    MATERIAL = "material",
    CONSUMABLE = "consumable",
    TECHNIQUE = "technique",
    ARTIFACT = "artifact",
    CATALYST = "catalyst",
}

export enum ItemRarity {
    COMMON = "common",
    UNCOMMON = "uncommon",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary",
}

export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    rarity: ItemRarity;
    stackable: boolean;
    maxStack: number;
}
