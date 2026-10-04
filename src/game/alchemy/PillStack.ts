import type { GameRarity } from "../crafting/CraftingResult";

export interface PillStack {
    definitionId: string;
    rarity: GameRarity;
    quantity: number;
}

export function createPillStackKey(
    definitionId: string,
    rarity: GameRarity,
): string {
    return `pill:${definitionId}:${rarity}`;
}
