export interface LootTableEntry {
    itemId: string;
    chance: number;
    minQuantity: number;
    maxQuantity: number;
}

export interface LootTable {
    id: string;
    entries: ReadonlyArray<LootTableEntry>;
}

export interface LootContext {
    chapter: number;
    stage: number;
    enemyId: string;
    isBoss: boolean;
}
